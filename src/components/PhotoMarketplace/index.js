import React, { Component } from "react";
import getWeb3, { getGanacheWeb3, Web3 } from "../../utils/getWeb3";

import {
  Loader,
  Button,
  Card,
  Input,
  Table,
  Form,
  Field,
  Image,
  Modal,
} from "rimble-ui";
import { zeppelinSolidityHotLoaderOptions } from "../../../config/webpack";
import styles from "../../App.module.scss";
import AuctionABI from "./../../../abi/AuctionHouse.json";
import MediaABI from "./../../../abi/Media.json";
import MarketABI from "./../../../abi/Market.json";
import ERC20ABI from "./../../../abi/ERC20.json";

import axios from "axios";

// axios.defaults.baseURL = 'http://api.opensea.io/api/v1/';

export default class PhotoMarketplace extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /////// Default state
      storageValue: 0,
      web3: null,
      accounts: null,
      currentAccount: null,
      route: window.location.pathname.replace("/", ""),

      /////// NFT
      tokenId: "",
      askValue: "",
      askCurrency: "",
      currentToken: undefined,
      currentAuction: undefined,
      timerState: 0,
      bidAmount: "",
    };

    //this.handlePhotoNFTAddress = this.handlePhotoNFTAddress.bind(this);
  }

  handleValue = (e) => {
    this.setState({ tokenValue: parseFloat(e.target.value) });
  };

  ///-------------------------------------
  /// NFT（Always load listed NFT data）
  ///-------------------------------------

  componentDidMount = async () => {
    setInterval(() => {
      this.setState({ timerState: this.state.timerState + 1 });
    }, 1000);

    try {
      const web3 = await getWeb3();
      // / Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      this.setState({ web3 });
      console.log("accounts", accounts);
      if (accounts.length == 0) throw "No web3";
      const currentAccount = accounts[0];
      const networkId = await web3.eth.net.getId();
      if (networkId != process.env.REACT_APP_NETWORK_ID)
        throw `It must be ${process.env.REACT_APP_NETWORK_ID} net`;
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  refreshValues = (instancePhotoNFTMarketplace) => {
    if (instancePhotoNFTMarketplace) {
      console.log("refreshValues of instancePhotoNFTMarketplace");
    }
  };

  handleTokenId = (e) => {
    this.setState({ tokenId: e.target.value });
  };

  searchNFT = async () => {
    const { web3 } = this.state;
    // axios
    // .post(process.env.REACT_APP_GRAPHQL_URL, {
    //   query: `
    //   {
    //     Token(limit: 1, where : {tokenId : {_eq : "${this.state.tokenId}"},
    //     address : {_eq : "${process.env.REACT_APP_MEDIA_ADDRESS}"}}){
    //       tokenId
    //       address
    //       mintTransferEvent {
    //         blockTimestamp
    //       }
    //       metadata {
    //         json
    //       }
    //       owner
    //       tokenURI
    //       media {
    //         contentURI
    //       }
    //       auctions (order_by : {auctionId : desc}, limit : 1) {
    //         auctionId
    //         status

    //       }
    //     }
    //   }

    //         `,
    // })
    // .then((response) => {
    //   console.log(response);
    //   if (response.data.data.Token.length > 0)
    //   {
    //     this.setState({ currentToken: response.data.data.Token[0] }, async ()=> {
    //         const web3 = this.state.web3;
    //         const marketInstance = new web3.eth.Contract(MarketABI.abi, process.env.REACT_APP_MARKET_ADDRESS);
    //         const askResult = await marketInstance.methods.currentAskForToken(this.state.currentToken.tokenId).call();
    //         this.setState({askValue : askResult[0], askCurrency : askResult[1]})
    //         console.log('ask Result', askResult)
    //     });
    //   }
    //   else this.setState({currentToken : undefined})
    // });

    const marketInstance = new web3.eth.Contract(
      MarketABI.abi,
      process.env.REACT_APP_MARKET_ADDRESS
    );
    const allNFT = await marketInstance.methods.getAllTokens().call();
    // const myNFT = (allNFT ? allNFT.filter(item => item.tokenOwner == currentAccount) : undefined)
    // this.setState({allPhotos : myNFT});
    if (allNFT) {
      allNFT.forEach((element) => {
        if (element.tokenId == this.state.tokenId) {
          this.setState({ currentToken: element, askValue: element.askValue });
        }
      });
    }

    const auctionInstance = new web3.eth.Contract(
      AuctionABI.abi,
      process.env.REACT_APP_AUCTION_ADDRESS
    );
    const allAuction = await auctionInstance.methods.getAllAuction().call();
    console.log("all auctions", allAuction);

    // const nftOnAuction = (allAuction ? allAuction.filter((item, index) => allNFT[index].tokenOwner ==))
    if (allAuction) {
      for (let i = 0; i < allAuction.length; i++) allAuction[i].auctionId = i;
    }
    const nftOnAuction = allAuction
      ? allAuction.filter((item) => {
          // console.log( allNFT[parseInt(item.tokenId)] == process.env.REACT_APP_AUCTION_ADDRESS )
          return (
            item.tokenOwner != "0x0000000000000000000000000000000000000000" &&
            allNFT[parseInt(item.tokenId)].tokenOwner ==
              process.env.REACT_APP_AUCTION_ADDRESS
          );
        })
      : undefined;

    if (nftOnAuction) {
      nftOnAuction.forEach((element) => {
        if (element.tokenId == this.state.tokenId) {
          this.setState({ currentAuction: element });
        }
      });
    }

    // axios
    // .post(process.env.REACT_APP_GRAPHQL_URL, {
    //   query: `
    //   {
    //     Auction(
    //       where: {status: {_in :["APPROVED", "IN_PROGRESS"]}, tokenContract: {_eq: "${process.env.REACT_APP_MEDIA_ADDRESS}"}, tokenId: {_eq: "${this.state.tokenId}"}}
    //     ) {
    //       auctionId
    //       amountTokenOwnerReceived
    //       approved
    //       auctionCurrency
    //       curator
    //       curatorFee
    //       curatorFeePercentage
    //       duration
    //       expiresAt
    //       firstBidTime
    //       lastBidAmount
    //       lastBidder
    //       reservePrice
    //       status
    //       tokenOwner
    //       winner
    //       token {
    //         id
    //       }
    //       createdEvent {
    //         id
    //       }
    //       canceledEvent {
    //         id
    //       }
    //       lastBidAmount
    //       lastBidder
    //       tokenId
    //     }
    //   }
    //         `,
    // })
    // .then((response) => {
    //   console.log(response);
    //   if (response.data.data.Auction.length > 0)
    //   {
    //     console.log('currentAuction', response.data.data.Auction[0] );
    //     this.setState({ currentAuction: response.data.data.Auction[0] });
    //   }
    //   else this.setState({currentAuction : undefined})
    // });
  };

  buyNow = async () => {
    try {
      const web3 = this.state.web3;
      // / Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      console.log("accounts", accounts);
      if (accounts.length == 0) throw "No web3";
      const currentAccount = accounts[0];
      const networkId = await web3.eth.net.getId();
      if (networkId != process.env.REACT_APP_NETWORK_ID)
        throw `It must be ${process.env.REACT_APP_NETWORK_ID} net`;

      // const ERC20Instance = new web3.eth.Contract(ERC20ABI, process.env.REACT_APP_WETH_ADDRESS);
      // const currentBalance = await ERC20Instance.methods.balanceOf(currentAccount).call();
      // console.log(currentBalance);
      // // const priceWei = web.utin
      // if (parseFloat(currentBalance) < parseFloat(this.state.askValue)) {
      //     alert('Failed! No enough buget');
      //     return;
      // }
      // const approveResult = await ERC20Instance.methods.approve(process.env.REACT_APP_MARKET_ADDRESS, this.state.askValue).send({from : currentAccount});
      // console.log('approve result', approveResult);

      const mediaInstance = new web3.eth.Contract(
        MediaABI.abi,
        process.env.REACT_APP_MEDIA_ADDRESS
      );
      const buyResult = await mediaInstance.methods
        .setBid(this.state.tokenId, {
          amount: this.state.askValue,
          bidder: currentAccount,
          recipient: currentAccount,

          sellOnShare: { value: "0" },
        })
        .send({ from: currentAccount, value: this.state.askValue });

      console.log("buy result", buyResult);
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  bidNow = async () => {
    try {
      const web3 = this.state.web3;
      // / Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      console.log("accounts", accounts);
      if (accounts.length == 0) throw "No web3";
      const currentAccount = accounts[0];
      const networkId = await web3.eth.net.getId();
      if (networkId != process.env.REACT_APP_NETWORK_ID)
        throw `It must be ${process.env.REACT_APP_NETWORK_ID} net`;

      // const ERC20Instance = new web3.eth.Contract(ERC20ABI, "0xc778417E063141139Fce010982780140Aa0cD5Ab");
      // const currentBalance = await ERC20Instance.methods.balanceOf(currentAccount).call();
      const bidAmountWei = web3.utils.toWei(this.state.bidAmount);
      console.log("bid Amount in Wei", bidAmountWei);

      const AuctionInstance = new web3.eth.Contract(
        AuctionABI.abi,
        process.env.REACT_APP_AUCTION_ADDRESS
      );
      const auctionResult = await AuctionInstance.methods
        .createBid(this.state.currentAuction.auctionId, bidAmountWei)
        .send({
          from: currentAccount,
          value: bidAmountWei,
        });

      console.log("auction result", auctionResult);
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  setBidValue = (e) => {
    this.setState({ bidAmount: e.target.value });
  };

  render() {
    const { web3, currentAccount } = this.state;

    console.log("render", currentAccount);
    const photo = this.state.currentToken;
    console.log("photo", photo);

    const priceAsk = web3 ? web3.utils.fromWei(this.state.askValue) : "";

    const auction = this.state.currentAuction;

    let expiresAt = 0;
    if (auction && auction.firstBidTime)
      expiresAt = parseInt(auction.firstBidTime) + parseInt(auction.duration);
    // console.log('expireAt', expiresAt);
    // console.log('time stamp', (new Date().getTime()))
    expiresAt -= Math.floor((new Date().getTime()) / 1000);
    if (expiresAt < 0) expiresAt = 0;
    // expiresAt = Math.floor(expiresAt / 1000)

    const reservePrice =
      web3 && auction && auction.reservePrice
        ? web3.utils.fromWei(auction.reservePrice)
        : 0.0;
    const highestBid =
      web3 && auction && auction.amount
        ? web3.utils.fromWei(auction.amount)
        : 0.0;

    return (
      <div className={styles.contracts}>
        <h2>Marketplace</h2>
        <p>Filter</p>
        <div>
          <Field label="Token Id">
            <Input
              type="number"
              width={1}
              placeholder="eg:5391"
              required={true}
              // value={this.state.valueNFTName}
              onChange={this.handleTokenId}
            />
          </Field>
          <Button size={"small"} mb={2} onClick={() => this.searchNFT()}>
            Search NFT
          </Button>
        </div>
        {photo && (
          <Card
            width={"360px"}
            maxWidth={"360px"}
            mx={"auto"}
            my={5}
            p={20}
            borderColor={"#E8E8E8"}
          >
            {/* <Image
                alt="random unsplash image"
                borderRadius={8}
                height="100%"
                maxWidth="100%"
                src={photo.media.contentURI}
                /> */}

            <span style={{ padding: "20px" }}></span>

            <p>Owner: {photo.tokenOwner}</p>
            <p>Token ID: {photo.tokenId}</p>

            <p>Ask Value: {priceAsk}</p>

            <Button
              size={"medium"}
              width={1}
              mb={4}
              // value={photo.nftData.tokenID}

              onClick={() => this.buyNow()}
              disabled={this.state.askValue == 0}
            >
              Buy It Now
            </Button>

            {auction && (
              <div>
                <p>AuctionID: {auction.auctionId}</p>
                <p>Owner: {auction.tokenOwner}</p>
                <p>Token ID: {auction.tokenId}</p>

                <br />

                <p>Reseve Value: {reservePrice}</p>
                <p>Highest Bid : {highestBid}</p>
                <p>Highest Bidder : {auction.lastBidder}</p>
                <p>Remain Time : {expiresAt} </p>
                <Field label="Token Id">
                  <Input
                    type="text"
                    width={1}
                    placeholder="eg: 0.02"
                    required={true}
                    // value={this.state.valueNFTName}
                    onChange={this.setBidValue}
                  />
                </Field>
                <Button
                  size={"medium"}
                  width={1}
                  mb={4}
                  // value={photo.nftData.tokenID}

                  onClick={() => this.bidNow()}
                >
                  Bid Now
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }
}
