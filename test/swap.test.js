const { fixture } = deployments;
const axios = require("axios");
const BigNumber = require("bignumber.js");
const { printGas, tokens, toWei } = require("./utils");

const { ParaSwap } = require("paraswap");
const { SwapSide } = require("paraswap-core");
const { expect } = require("chai");

const networkID = 137;
const partner = "paraswap";
const apiURL = "https://apiv5.paraswap.io";
const slippage = 1; // 1%

function getToken(symbol) {
  const token = tokens[networkID]?.find((t) => t.symbol === symbol);

  if (!token)
    throw new Error(`Token ${symbol} not available on network ${networkID}`);
  return token;
}

describe("Swapper", () => {
  before(async function () {
    [_owner, _user] = await ethers.getSigners();
    owner = _owner.address;
    user = _user.address;

    // Deploy contracts
    await fixture(["Swapper"]);
    swapper = await ethers.getContract("Swapper");

    paraswap = new ParaSwap(networkID, apiURL, process.env.RPC_URL);
  });

  it("should get paraswap swap params using SDK", async function () {
    const srcToken = getToken("MATIC");
    const destToken = getToken("WETH");

    const srcAmount = toWei(1);

    const priceRouteOrError = await paraswap.getRate(
      srcToken.address,
      destToken.address,
      srcAmount,
      swapper.address,
      SwapSide.SELL,
      { partner },
      srcToken.decimals,
      destToken.decimals
    );

    // console.log("\ngetRate", priceRouteOrError);

    if ("message" in priceRouteOrError) {
      throw new Error(priceRouteOrError.message);
    }

    const minAmount = new BigNumber(priceRouteOrError.destAmount)
      .times(1 - slippage / 100)
      .toFixed(0);

    const transactionRequestOrError = await paraswap.buildTx(
      srcToken.address,
      destToken.address,
      srcAmount,
      minAmount,
      priceRouteOrError,
      swapper.address,
      partner,
      undefined,
      undefined,
      swapper.address,
      { ignoreChecks: true }
    );

    if ("message" in transactionRequestOrError) {
      throw new Error(transactionRequestOrError.message);
    }

    // console.log("\nbuildTx", transactionRequestOrError);

    expect(transactionRequestOrError.chainId).to.eq(networkID);

    const tx = await swapper
      .connect(_user)
      .swap([transactionRequestOrError.data], [destToken.address], {
        value: toWei(1),
      });

    await printGas(tx);

    const destTokenContract = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      destToken.address
    );

    expect(await destTokenContract.balanceOf(user)).to.not.equal(0);
  });

  it("should get paraswap swap params using API", async function () {
    const srcToken = getToken("MATIC");
    const destToken = getToken("WETH");

    const srcAmount = toWei(1);

    const tokenInfo = {
      srcToken: srcToken.address,
      destToken: destToken.address,
      srcDecimals: srcToken.decimals,
      destDecimals: destToken.decimals,
    };

    const {
      data: { priceRoute },
    } = await axios.get(`${apiURL}/prices`, {
      params: {
        ...tokenInfo,
        amount: srcAmount,
        network: networkID,
        userAddress: swapper.address,
        partner,
      },
    });

    // console.log("\ngetRate", priceRoute);

    const deadline = Math.floor(Date.now() / 1000) + 600;

    const POST_DATA = {
      ...tokenInfo,
      srcAmount,
      userAddress: swapper.address,
      receiver: swapper.address,
      txOrigin: user,
      slippage: slippage * 100,
      deadline,
      priceRoute,
    };

    const { data } = await axios.post(
      `${apiURL}/transactions/${networkID}`,
      JSON.stringify(POST_DATA),
      {
        headers: { "Content-Type": "application/json" },
        params: {
          onlyParams: false,
          ignoreChecks: true,
          ignoreGasEstimate: true,
        },
      }
    );

    // console.log("\nbuildTx", data);

    expect(data.chainId).to.eq(networkID);

    const tx = await swapper
      .connect(_user)
      .swap([data.data], [destToken.address], {
        value: toWei(1),
      });

    await printGas(tx);

    const destTokenContract = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      destToken.address
    );

    expect(await destTokenContract.balanceOf(user)).to.not.equal(0);
  });
});
