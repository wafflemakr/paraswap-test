const CONTRACT_NAME = "Swapper";

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const FEE = 100; // 1%

  // Upgradeable Proxy
  await deploy(CONTRACT_NAME, {
    from: deployer,
    proxy: {
      owner: deployer,
      execute: {
        init: {
          methodName: "initialize",
          args: [FEE],
        },
      },
    },

    log: true,
  });
};

module.exports.tags = [CONTRACT_NAME];
