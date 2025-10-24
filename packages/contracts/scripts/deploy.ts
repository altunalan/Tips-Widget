import { ethers } from 'hardhat';

async function main() {
  const TipsVault = await ethers.getContractFactory('TipsVault');
  const tipsVault = await TipsVault.deploy();
  await tipsVault.waitForDeployment();
  console.log('TipsVault deployed to:', await tipsVault.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
