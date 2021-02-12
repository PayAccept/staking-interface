window.addEventListener('load', async () => {
    // New web3 provider
          if (window.ethereum) {
              window.web3 = new Web3(window.ethereum);
              try {
                  // ask user for permission
                  await window.ethereum.enable();
                  callCheck();

                //   checkAccount();
                  // user approved permission
              } catch (error) {
                  // user rejected permission
                  $("#notifictionMessage").html("User Rejected to connect with Metamask")
                  $(".tipBox").css("opacity","1");
              }
          }
    // Old web3 provider
      else if (window.web3) {
          window.web3 = new Web3(web3.currentProvider);
          // no need to ask for permission
      }
    // No web3 provider
      else {
        $("#notifictionMessage").html("Metamask is not Installed")
        $(".tipBox").css("opacity","1");
    }
});


const stakeAddress = "0xa090C2A3A5Ab0A5196E35174Fd1B40C13BD580c7";

const tokenAddress = ["0x8EF47555856f6Ce2E0cd7C36AeF4FAb317d2e2E2","0x166200cd8db2474ab4aa323261fa5a7e97a98dd5"];

var userStakeAmount = 0;
const networkId = 1;
const netWorkUrl = "https://etherscan.io/tx/"

let userStake = 0;
let userBalance = 0;
let userApporoved = 0;
let totalStakeAmount = 0;

let tokens = '';
let tokenInstance=[];
let userStakedTokenIndex = 0;
let userStakedTokenAddess = '';
let MAX_AMOUNT = 500;

async function callCheck(){
    let address = await window.web3.eth.getAccounts();
    let id = await window.web3.eth.net.getId();
    window.id = id;
    window.walletAddress = address[0];
    if(id !== networkId){
        $("#notifictionMessage").html("Please Select Mainnet Network")
        $(".tipBox").css("opacity","1");
        return false;
    }
    window.StakeInstance =await new window.web3.eth.Contract(stakeabi,stakeAddress);
    for(var i =0;i<tokenAddress.length;i++)
    {
        tokenInstance[i] =await new window.web3.eth.Contract(tokenabi,tokenAddress[i]);

    }
     tokenList();

    let account = address[0].substr(0,5)+"..."+ address[0].substr(-4)
    $("#userAddress").html(account.toLowerCase());
    $("#myModal").modal('show');
}

async function balanceChecker(_tokenaddr,index){
    let address = window.walletAddress;

    userStake = window.web3.utils.fromWei(await  window.StakeInstance.methods.stakeBalance(_tokenaddr,address).call());
    userBalance = window.web3.utils.fromWei(await tokenInstance[index].methods.balanceOf(address).call());
    userApporoved = window.web3.utils.fromWei(await tokenInstance[index].methods.allowance(address,stakeAddress).call());
    totalStakeAmount = window.web3.utils.fromWei(await tokenInstance[index].methods.balanceOf(stakeAddress).call());
    $("#userBalance").html(Number(userBalance).toFixed(2));
    $("#userStake").html(Number(userStake).toFixed(2));
    $("#userTotal").html((Number(userBalance)+Number(userStake)).toFixed(2));
    $("#totalStakeAmount").html(Number(totalStakeAmount).toFixed(2));

    calcUserBalance();
}

async function tokenList(){

    $.getJSON("./token_logo.json", async function (data){

        let tokenLength = await window.StakeInstance.methods.availabletokens().call();
        let tokenSymbol ;

        var tokenDiv = document.getElementById('token-list');

       for(var i = 0;i<tokenLength;i++)
       {
        tokens= await window.StakeInstance.methods.tokens(i).call();

                tokenSymbol = await tokenInstance[i].methods.symbol().call();
                var tokensym = document.createElement('div');
                var linebreak =document.createElement('br')
                tokensym.innerHTML = tokenSymbol;
                tokensym.id = "avltoken" + i;

                var tokenImageDiv = document.createElement('div');
                tokenImageDiv.className = "token-symbol";
                var tokenImg = document.createElement('img');
                tokenImg.src = data[i].logo;
                // tokenImageDiv.prepend(tokenImg);
                tokensym.prepend(tokenImg);
                tokensym.setAttribute('onclick', 'tokenToBeStaked(this.id)');
                tokenDiv.appendChild(tokensym);
                tokensym.appendChild(linebreak);
            }
    });

 }

  function tokenToBeStaked(id){

     var symbol=document.getElementById(id).innerHTML;
     var index = id.substr(-1);
     var stakeTokenAddress = tokenAddress[index];
    for(var i = 0;i<tokenAddress.length;i++)
        {
            if(tokenAddress[i]==stakeTokenAddress)userStakedTokenIndex = i;userStakedTokenAddess=stakeTokenAddress;
        }
    balanceChecker(stakeTokenAddress,userStakedTokenIndex);
    $('#myModal').modal('hide');

            $.getJSON("./token_logo.json", function (data){
                        var tokendata=[];
                        $.each(data,function(index,value){
                        tokendata.push(value);

                        });

                    for(var i= 0;i < tokendata.length; i++)
                    {
                        if(index == tokendata[i].index)
                        {
                            var img = tokendata[i].logo;
                            document.getElementById("token-logo").src=img;
                            document.getElementById("auint").innerHTML= tokendata[i].name;
                            document.getElementById("suint").innerHTML= tokendata[i].name;
                            document.getElementById("tuint").innerHTML= tokendata[i].name;
                        }
                    }
            });
  }

async function calcUserBalance(){
    let address = window.walletAddress;
    var totalReward = Number(await window.StakeInstance.methods.getOnlyRewards(userStakedTokenAddess,address).call()) ;
    var Apy = Number(await window.StakeInstance.methods.annualMintPercentage(userStakedTokenAddess).call()) ;
    $("#accrued_rewards").html(Number(totalReward).toFixed(2));
    $("#apy_id").html(Number(Apy / 100).toFixed(2));
}

function maxStakeAmount(){
    if(MAX_AMOUNT > userBalance){
        $("#stakeAmount").val(userBalance);
    }else{
        $("#stakeAmount").val(MAX_AMOUNT);
    }
}

async function approve(){
    let a = $("#stakeAmount").val();
    let address = window.walletAddress;
    if(Number(a) >  userBalance){
      return false;
    }
    a = window.web3.utils.toWei(a);

    tokenInstance[userStakedTokenIndex].methods.approve(stakeAddress,a).send({from: address,value: 0,})
       .on('transactionHash', (hash) => {
       showLoader("Approving Tokens")})
    .on('receipt', (receipt) => {
        hideLoader();
        $("#notifictionMessage").html("Token Is Approved You can Stake Now")
        $(".tipBox").css("opacity","1");
        $("#stakeAmount").attr("disabled","true");
        $("#stakeButtonDiv").html("<div class='maxButton max button' onclick='stake();'><span class='label'>Stake</span></div>")

    }).on("error", (error) => {
        hideLoader()
        if (error.message.includes("User denied transaction signature")) {
            $("#notifictionMessage").html("User denied transaction signature")
            $(".tipBox").css("opacity","1");
        } else {
            $("#notifictionMessage").html("Your Approval failed, please try again")
            $(".tipBox").css("opacity","1");
        }
    })
}

async function stake(){

    let a = $("#stakeAmount").val();
    let address = window.walletAddress;

    a = window.web3.utils.toWei(a);
    window.StakeInstance.methods.stake(userStakedTokenAddess,a).send({ from: address,value: 0,})
    .on('transactionHash', (hash) => {
        showLoader("Staking Tokens")
    })
    .on('receipt', (receipt) => {

                $("#stakeAmount").attr("disabled","false");
                $("#stakeAmount").val("0");
                setTimeout(()=>{
                    $("#notifictionMessage").html("Token Staked Successfully")
                    $(".tipBox").css("opacity","1");
                    hideLoader();
                    balanceChecker(userStakedTokenAddess,userStakedTokenIndex);
                    closeStake();
                },2000)
    }).on("error", (error) => {
        hideLoader();
        if (error.message.includes("User denied transaction signature")) {
            $("#notifictionMessage").html("User denied transaction signature")
            $(".tipBox").css("opacity","1");
        } else {
            $("#notifictionMessage").html("Your Stake failed, please try again")
            $(".tipBox").css("opacity","1");
        }
    })

}
async function unstake(){
    let address = window.walletAddress;
    window.StakeInstance.methods.unStake(userStakedTokenAddess).send({from: address,value: 0})
    .on('transactionHash', (hash) => {
        showLoader("Unstaking Tokens");
    }).on('receipt', (receipt) => {
        $("#stakeAmount").attr("disabled","false");
        $("#stakeAmount").val("0");
        setTimeout(()=>{
            $("#notifictionMessage").html("Token Unstaked Succesfully")
            $(".tipBox").css("opacity","1");
            hideLoader();
            balanceChecker(userStakedTokenAddess,userStakedTokenIndex);
            closeUnStake();
        })
    }).on("error", (error) => {
        hideLoader();
        if (error.message.includes("User denied transaction signature")) {
            $("#notifictionMessage").html("User denied transaction signature")
            $(".tipBox").css("opacity","1");
        } else {
            $("#notifictionMessage").html("Your Stake failed, please try again")
            $(".tipBox").css("opacity","1");
        }
    })
  }

function showLoader(text){
    $.LoadingOverlay("show", {
        image       : "images/loader.png",
        text        : text,
        textResizeFactor: 0.4
    });
  }

  function hideLoader(){
    $.LoadingOverlay("hide");
  }

function closeStake(){
    $(".stake").removeClass("open");
    $(".stake .openTitle").hide();
    $(".stake .openTitle").css("letter-spacing","0px");
    $(".stake .closeTitle").show();
    $(".stake .closeTitle").css("letter-spacing","0px");
    $(".unstake").removeClass("close");
    $(".stake .floatEditor").hide();
    $(".stake .floatEditor").css("opacity","0");
    $(".stake .floatClose").hide();
    $(".stake .floatClose").css("opacity","0");
}

function closeUnStake(){
    $(".unstake").removeClass("open");
    $(".unstake .openTitle").hide();
    $(".unstake .openTitle").css("letter-spacing","0px");
    $(".unstake .closeTitle").show();
    $(".unstake .closeTitle").css("letter-spacing","0px");
    $(".stake").removeClass("close");
    $(".unstake .floatEditor").hide();
    $(".unstake .floatEditor").css("opacity","0");
    $(".unstake .floatClose").hide();
    $(".unstake .floatClose").css("opacity","0");
}


$(document).ready(function(){

    $(".stake").click(function(){
        if($(event.target).hasClass("tipClose")){
          return ;
        }
        if(window.id !== networkId){
            return ;
        }
        if(Number(userStake) > 0){
            $("#notifictionMessage").html("You Already Staked Tokens")
            $(".tipBox").css("opacity","1");
            return ;
        }
        $(".stake").addClass("open");
        $(".stake .openTitle").show();
        $(".stake .openTitle").css("letter-spacing","0px");
        $(".stake .closeTitle").hide();
        $(".stake .closeTitle").css("letter-spacing","38px");
        $(".unstake").addClass("close");
        $(".stake .floatEditor").show();
        $(".stake .floatEditor").css("opacity","1");
        $(".stake .floatClose").show();
        $(".stake .floatClose").css("opacity","1");
      })

      $(".unstake").click(function(){
        if($(event.target).hasClass("tipClose")){
          return ;
        }
        if(window.id !== networkId){
            return ;
        }
        if(Number(userStake) === 0){
            $("#notifictionMessage").html("Stake Some Token First")
            $(".tipBox").css("opacity","1");
            return ;
        }
        $(".unstake").addClass("open");
        $(".unstake .openTitle").show();
        $(".unstake .openTitle").css("letter-spacing","0px");
        $(".unstake .closeTitle").hide();
        $(".unstake .closeTitle").css("letter-spacing","38px");
        $(".stake").addClass("close");
        $(".unstake .floatEditor").show();
        $(".unstake .floatEditor").css("opacity","1");
        $(".unstake .floatClose").show();
        $(".unstake .floatClose").css("opacity","1");
      })


      $("#stakeClose .tipClose").click(function(){
        closeStake();
      })

      $("#unStakeClose .tipClose").click(function(){
        closeUnStake()
      })

      $("#notiClose").click(function(){
          $(".tipBox").css("opacity","0");
      })

    $('#stakeAmount').keydown(function(event){
        if (event.shiftKey == true)
            event.preventDefault();
            var code = event.keyCode;
            if ((code >= 48 && code <= 57) || (code >= 96 && code <= 105) || code == 8 || code == 9 || code == 37 || code == 39 || code == 46 || code == 190 || code == 110) {
            // allowed characters
            } else
            event.preventDefault();
    })

    $('#stakeAmount').keyup(function(){

        if(Number(userStake) > 0){
            $("#stakeAmount").val(0);
            $("#notifictionMessage").html("You Already Staked Token");
            $(".tipBox").css("opacity","1");
        }

        if(Number($(this).val()) > userBalance){
            $("#stakeAmount").val(userBalance);

        }
        if(Number($(this).val()) > MAX_AMOUNT){
           $("stakeAmount").val(MAX_AMOUNT);
        }
    })
})



