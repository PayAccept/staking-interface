
/*var Token = artifacts.require("Token.sol");
module.exports = function(deployer)
{
	deployer.deploy(Token);
};	

var Staking = artifacts.require("Staking.sol");
module.exports = function(deployer)
{
	deployer.deploy(Staking,[Token.address]);
};	*/
var Token = artifacts.require("Token.sol");


var Staking = artifacts.require("Staking.sol");

module.exports = async function(deployer)
{

	 await deployer.deploy(Token);
	
	 
	 
	 await deployer.deploy(Staking,[Token.address]);

	 

};	