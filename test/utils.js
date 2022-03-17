exports.toWei = (num) => String(ethers.utils.parseEther(String(num)));
exports.fromWei = (num) => Number(ethers.utils.formatEther(num));
exports.printGas = async (tx) => {
  const receipt = await tx.wait();

  console.log("\tGas Used:", Number(receipt.gasUsed));
};
exports.increaseBlocks = async (amt) => {
  for (let i = 0; i < amt; i++) {
    await ethers.provider.send("evm_mine");
  }
};
exports.increaseTime = async (sec) => {
  await ethers.provider.send("evm_increaseTime", [sec]);
  await ethers.provider.send("evm_mine");
};
exports.currentTime = async () => {
  const { timestamp } = await ethers.provider.getBlock();
  return timestamp;
};
exports.toDays = (amt) => 60 * 60 * 24 * amt;

exports.tokens = {
  [1]: [
    {
      decimals: 18,
      symbol: "ETH",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
    {
      decimals: 6,
      symbol: "USDC",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    {
      decimals: 18,
      symbol: "DAI",
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
  ],
  [137]: [
    {
      decimals: 18,
      symbol: "MATIC",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
    {
      decimals: 8,
      symbol: "WBTC",
      address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    },
    {
      decimals: 18,
      symbol: "WETH",
      address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    },
  ],
};
