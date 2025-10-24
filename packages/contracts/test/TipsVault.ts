import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';

describe('TipsVault', () => {
  async function deployFixture() {
    const [owner, recipient] = await ethers.getSigners();
    const TipsVault = await ethers.getContractFactory('TipsVault');
    const tipsVault = await TipsVault.deploy();
    await tipsVault.waitForDeployment();
    return { tipsVault, owner, recipient };
  }

  it('emits TipSent and updates balance on tip', async () => {
    const { tipsVault, owner, recipient } = await loadFixture(deployFixture);
    const memo = 'Keep it up!';
    const tipValue = ethers.parseEther('0.1');

    await expect(
      tipsVault.connect(owner).tip(recipient.address, memo, { value: tipValue }),
    )
      .to.emit(tipsVault, 'TipSent')
      .withArgs(owner.address, recipient.address, tipValue, memo);

    const balance = await tipsVault.balances(recipient.address);
    expect(balance).to.equal(tipValue);
  });

  it('allows recipient to withdraw funds', async () => {
    const { tipsVault, owner, recipient } = await loadFixture(deployFixture);
    const tipValue = ethers.parseEther('0.2');

    await tipsVault.connect(owner).tip(recipient.address, 'Thanks', { value: tipValue });

    await expect(() => tipsVault.connect(recipient).withdraw(tipValue)).to.changeEtherBalances(
      [tipsVault, recipient],
      [-tipValue, tipValue],
    );

    const balance = await tipsVault.balances(recipient.address);
    expect(balance).to.equal(0n);
  });

  it('reverts when withdrawing more than balance', async () => {
    const { tipsVault, recipient } = await loadFixture(deployFixture);

    await expect(tipsVault.connect(recipient).withdraw(1n)).to.be.revertedWithCustomError(
      tipsVault,
      'InsufficientBalance',
    );
  });
});
