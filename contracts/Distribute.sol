// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

contract OptimizedDistribute {
    uint256 internal immutable createTime;
    address internal immutable contributor1;
    address internal immutable contributor2;
    address internal immutable contributor3;
    address internal immutable contributor4;

    constructor(address[4] memory _contributors) {
        contributor1 = _contributors[0];
        contributor2 = _contributors[1];
        contributor3 = _contributors[2];
        contributor4 = _contributors[3];
        createTime = block.timestamp + 1 weeks;
    }

    function distribute() external {
        require(block.timestamp > createTime, 'cannot distribute yet');

        address cont1 = contributor1;
        address cont2 = contributor2;
        address cont3 = contributor3;
        address cont4 = contributor4;

        assembly {
            let amount := shr(2, selfbalance())
            pop(call(gas(), cont1, amount, 0, 0, 0, 0))
            pop(call(gas(), cont2, amount, 0, 0, 0, 0))
            pop(call(gas(), cont3, amount, 0, 0, 0, 0))
            selfdestruct(cont4)
        }
    }
}
