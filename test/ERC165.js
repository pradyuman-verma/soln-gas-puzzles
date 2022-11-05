const {
    time,
    loadFixture,
} = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { expect } = require('chai');
const { ethers } = require('hardhat');

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};

// RULES
// - You may only use the attacker account
// - Multiple transactions allowed, but fewer makes you cooler
// - You may not modify the victim contract or anything it inherits from
// - You may not modify NFT or the parent contracts
// - You may not modify the tests, you may only write code in the specified block
// - You may not tamper with the javascript random number generator
// - You pass the challenge if you pass the test, but if you can
//   lower the GAS_LIMIT below 46, that makes you cooler

describe('ERC165Challenge', function () {
    this.beforeEach(async function () {
        await ethers.provider.send('hardhat_reset');
        [owner, attacker] = await ethers.getSigners();
        const AwardFactory = await ethers.getContractFactory('Award');
        const award = await AwardFactory.deploy();

        const order = [1, 2, 3, 4];
        shuffleArray(order);

        const Factory = await ethers.getContractFactory('NFTGiver');
        const victim = await Factory.deploy(award.address, order);

        this.victim = victim;
        this.attacker = attacker;
        this.award = award;
        this.order = order;
        award.transferFrom(owner.address, victim.address, 1337);
    });

    /**
     * CALLVALUE // This will laod 0 into the stack as msg.value is 0
     * CALLDATALOAD // This will load the 32 byte calldata starting from offset 0
     * PUSH1 0xe0 // This will push 224 onto the stack
     * SHR // Now our stack has 32 byte calldata, and 224. This operation will right shift it by 28 bytes and put it onto the stack
     * GASPRICE // This will put gas price of tx onto the stack i.e., tx.gasprice
     * EQ // This will check whether the gasprice or calldata is equal or not and put 0/1 onto the stack
     * CALLVALUE // Now again load 0 onto the stack
     * MSTORE // Now we store the result of EQ at location 0
     * MSIZE    // This will put the current memory size onto the stack
     * CALLVALUE // This will again put 0 onto the stack
     * RETURN // Now we will return the memory from offset to offset + size
     */
    [1, 2, 3, 4, 5, 6, 7].forEach(function (round) {
        it(`Hack Round ${round}`, async function () {
            /* YOUR CODE HERE */
            const bytecode =
                // '0x600d600d600039600d6000f300343560e01c3a1434525934f3'; // .call()
                '0x600d600d600039600d6000f30060043560e01c3a1434525934f3';
            let tx = {
                from: attacker.address,
                data: bytecode,
            };

            tx = await attacker.sendTransaction(tx);
            const contract = tx.creates;

            for (let x = 3; x >= 0; x--) {
                if (this.order[x] === 1)
                    await this.victim
                        .connect(attacker)
                        .challenge1(contract, { gasPrice: 1310921440 });
                else if (this.order[x] === 2)
                    await this.victim
                        .connect(attacker)
                        .challenge2(contract, { gasPrice: 2292697692 });
                else if (this.order[x] === 3)
                    await this.victim
                        .connect(attacker)
                        .challenge3(contract, { gasPrice: 322376503 });
                else
                    await this.victim
                        .connect(attacker)
                        .challenge4(contract, { gasPrice: 3737844751 });
            }

            await this.victim.connect(attacker).success(contract);
        });
    });

    this.afterEach(async function () {
        expect(await this.award.ownerOf(1337)).to.be.equal(
            this.attacker.address
        );
    });

    this.afterAll(async function () {
        const limitUsed = await this.victim.GAS_LIMIT();
        const numTxns = await ethers.provider.getTransactionCount(
            attacker.address
        );
        console.log(`\nGas limit used: ${limitUsed}`);
        console.log(`Number of Transactions: ${numTxns}`);
    });
});
