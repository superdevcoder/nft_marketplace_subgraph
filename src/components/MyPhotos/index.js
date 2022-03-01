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
import AuctionABI from './../../../abi/AuctionHouse.json'
import MediaABI from './../../../abi/Media.json'
import MarketABI from './../../../abi/Market.json'

import axios from "axios";
require('dotenv').config()

// axios.defaults.baseURL = 'http://api.opensea.io/api/v1/';

export default class MyPhotos extends Component {
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
      allPhotos: [],
      allOpenSeaNFTs: [],
      details: "",
      tokenId: "",
      tokenValue : 0.0, 
      currentAuction : undefined, 
      timerState : 0
    };

    //this.handlePhotoNFTAddress = this.handlePhotoNFTAddress.bind(this);

  }

  handleValue = (e) => {
      this.setState({tokenValue : parseFloat(e.target.value)})
  }

  

  cancelOnSale = async (e) => {
    try {
      const { web3, accounts, photoNFT, photoMarketplace } = this.state;

      console.log("=== value of cancelOnSale ===", e.target.value);

      const photoId = e.target.value;
      /// Cancel on sale
      // const txReceipt1 = await photoNFT.methods.approve("0x0000000000000000000000000000000000000000", photoId).send({from : accounts[0]});

      const txReceipt2 = await photoMarketplace.methods
        .cancelTrade(photoId)
        .send({ from: accounts[0] });

      console.log("=== response of cancelTrade ===", txReceipt2);
      await this.getAllPhotos();
    } catch (error) {
      console.log(error);
    }
  };

  ///-------------------------------------
  /// NFT（Always load listed NFT data）
  ///-------------------------------------
  

  componentDidMount = async () => {
    setInterval(() => {
      this.setState({timerState : this.state.timerState + 1})
    }, 1000)
    try {

      console.log(process.env)
      const web3 = await getWeb3();
      // / Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      this.setState({web3})
      console.log("accounts", accounts);
      if (accounts.length == 0) throw "No web3";
      const currentAccount = accounts[0];
      const networkId = await web3.eth.net.getId();
      console.log('netwokrID', networkId, process.env.REACT_APP_NETWORK_ID)
      if (networkId != process.env.REACT_APP_NETWORK_ID) throw `It must be ${process.env.REACT_APP_NETWORK_ID} net`


      // //here load NFT data
      // axios
      //   .post(process.env.REACT_APP_GRAPHQL_URL, {
      //     query: `                
      //               {
      //                   Token(limit: 20, where : {owner : {_eq : "${currentAccount}"}, 
      //                   address : {_eq : "${process.env.REACT_APP_MEDIA_ADDRESS}"}}){
      //                   tokenId
      //                   address
      //                   mintTransferEvent {
      //                       blockTimestamp
      //                   }
      //                   media {
      //                       contentURI
      //                   }
      //                   metadata {
      //                       json
      //                   }
      //                   owner
      //                   tokenURI
      //                   auctions (order_by : {auctionId : desc}, limit : 1) {
      //                       auctionId
      //                       status
                            
      //                     }
      //                   }
      //               }  
      //           `,
      //   })
      //   .then((response) => {
      //     console.log(response);
      //     this.setState({ allPhotos: response.data.data.Token });
      //   });
      const marketInstance = new web3.eth.Contract(MarketABI.abi, process.env.REACT_APP_MARKET_ADDRESS);
      const allNFT = await marketInstance.methods.getAllTokens().call();
      console.log('all nfts', allNFT)
      const myNFT = (allNFT ? allNFT.filter(item => item.tokenOwner == currentAccount) : undefined)
      this.setState({allPhotos : myNFT});

      const auctionInstance = new web3.eth.Contract(AuctionABI.abi, process.env.REACT_APP_AUCTION_ADDRESS);
      const allAuction = await auctionInstance.methods.getAllAuction().call();
      console.log('all auctions', allAuction);

      // const nftOnAuction = (allAuction ? allAuction.filter((item, index) => allNFT[index].tokenOwner ==))
      if (allAuction) {
        for (let i = 0; i < allAuction.length; i++) allAuction[i].auctionId = i;
      }
      const nftOnAuction = (allAuction ? allAuction.filter((item) => {
        // console.log( allNFT[parseInt(item.tokenId)] == process.env.REACT_APP_AUCTION_ADDRESS )
        return (item.tokenOwner != "0x0000000000000000000000000000000000000000" && 
        allNFT[parseInt(item.tokenId)].tokenOwner == process.env.REACT_APP_AUCTION_ADDRESS) }) : undefined);
      console.log('nft on Auction', nftOnAuction);
      const myNftOnAuction = (nftOnAuction ? nftOnAuction.filter(item => item.tokenOwner == currentAccount) : undefined);
      this.setState({currentAuction : myNftOnAuction})
      


        // axios
        // .post(process.env.REACT_APP_GRAPHQL_URL, {
        //   query: `                
        //   {
        //     Auction(
        //       where: {status: {_in :["APPROVED", "IN_PROGRESS"]}, tokenContract: {_eq: "${process.env.REACT_APP_MEDIA_ADDRESS}"}, tokenOwner: {_eq: "${currentAccount}"}}
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
        //     this.setState({ currentAuction: response.data.data.Auction });
        //   }
        //   else this.setState({currentAuction : undefined})
        // });
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

  putOnAuction = (tokenId) => {
    this.setState({ details: "auction", tokenId: tokenId });
  };

  putOnAsk = (tokenId) => {
    this.setState({ details: "ask", tokenId });
  };



  refreshValues = (instancePhotoNFTMarketplace) => {
    if (instancePhotoNFTMarketplace) {
      console.log("refreshValues of instancePhotoNFTMarketplace");
    }
  };

  setAskPrice = async () => {
    try {
        console.log('setReservePrice function', this.state.tokenValue);
        if (!(this.state.tokenValue > 0)) {
            console.error('value must be bigger than zero', this.state.tokenValue)
        }
        const web3 = this.state.web3;
        // console.log(web3);
        // / Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();
        console.log("accounts", accounts);
        if (accounts.length == 0) throw "No web3";
        const currentAccount = accounts[0];
        const networkId = await web3.eth.net.getId();

        if (networkId != process.env.REACT_APP_NETWORK_ID) throw `It must be ${process.env.REACT_APP_NETWORK_ID} net`

        const mediaInstance = new web3.eth.Contract(MediaABI.abi, process.env.REACT_APP_MEDIA_ADDRESS);
    
        const weiValue = web3.utils.toWei(this.state.tokenValue.toString());
        console.log('weiValue', weiValue);

        const askResult = await mediaInstance.methods.setAsk(this.state.tokenId, weiValue)
            .send({from : currentAccount});
        console.log('auction Create result', askResult);


      } catch (error) {
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`
        );
        console.error(error);
      }
  }

  setReservePrice = async () => {
      
    try {
        console.log('setReservePrice function', this.state.tokenValue);
        if (!(this.state.tokenValue > 0)) {
            console.error('value must be bigger than zero', this.state.tokenValue)
        }
        const web3 = this.state.web3;
        // console.log(web3);
        // / Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();
        console.log("accounts", accounts);
        if (accounts.length == 0) throw "No web3";
        const currentAccount = accounts[0];
        const networkId = await web3.eth.net.getId();

        if (networkId != process.env.REACT_APP_NETWORK_ID) throw `It must be ${process.env.REACT_APP_NETWORK_ID} net`

        const auctionHouseInstance = new web3.eth.Contract(AuctionABI.abi, process.env.REACT_APP_AUCTION_ADDRESS);
        console.log('auctionHouseInstance', auctionHouseInstance);

        const mediaInstance = new web3.eth.Contract(MediaABI.abi, process.env.REACT_APP_MEDIA_ADDRESS);
        console.log('mediaInstance', mediaInstance)
        const approveResult = await mediaInstance.methods.approve(process.env.REACT_APP_AUCTION_ADDRESS, this.state.tokenId).send({
            from: currentAccount
        });

        const weiValue = web3.utils.toWei(this.state.tokenValue.toString());
        console.log('weiValue', weiValue);

        const auctionCreateResult = await auctionHouseInstance.methods.createAuction(this.state.tokenId, 
          process.env.REACT_APP_MEDIA_ADDRESS, 
            900, 
            weiValue, 
            "0x0000000000000000000000000000000000000000", 
            0, 
            "0x0000000000000000000000000000000000000000"
            )
            .send({from : currentAccount});
        console.log('auction Create result', auctionCreateResult);


      } catch (error) {
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`
        );
        console.error(error);
      }

  }

  endAuction = async (autionId) => {
    try {
      console.log('setReservePrice function', this.state.tokenValue);
      if (!(this.state.tokenValue > 0)) {
          console.error('value must be bigger than zero', this.state.tokenValue)
      }
      console.log('before get web3')
      const web3 = this.state.web3;
      // console.log(web3);
      // / Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      console.log("accounts", accounts);
      if (accounts.length == 0) throw "No web3";
      const currentAccount = accounts[0];
      const networkId = await web3.eth.net.getId();

      if (networkId != process.env.REACT_APP_NETWORK_ID) throw `It must be ${process.env.REACT_APP_NETWORK_ID} net`

      const auctionHouseInstance = new web3.eth.Contract(AuctionABI.abi, process.env.REACT_APP_AUCTION_ADDRESS);
      console.log('auctionHouseInstance', auctionHouseInstance);

      const result = await auctionHouseInstance.methods.endAuction(autionId).send({from : currentAccount})
      console.log('auction end result', result)

    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  }

  cancelAuction = async (auctionId) => {
    try {
      // console.log('setReservePrice function', this.state.tokenValue);
      // if (!(this.state.tokenValue > 0)) {
      //     console.error('value must be bigger than zero', this.state.tokenValue)
      // }
      console.log('before get web3')
      const web3 = this.state.web3;
      // console.log(web3);
      // / Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      console.log("accounts", accounts);
      if (accounts.length == 0) throw "No web3";
      const currentAccount = accounts[0];
      const networkId = await web3.eth.net.getId();

      if (networkId != process.env.REACT_APP_NETWORK_ID) throw `It must be ${process.env.REACT_APP_NETWORK_ID} net`

      const auctionHouseInstance = new web3.eth.Contract(AuctionABI.abi, process.env.REACT_APP_AUCTION_ADDRESS);
      console.log('auctionHouseInstance', auctionHouseInstance);

      const result = await auctionHouseInstance.methods.cancelAuction(auctionId).send({from : currentAccount})
      console.log('auction end result', result)

    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }

  }

  render() {
    const { web3, allPhotos, currentAccount, allOpenSeaNFTs } = this.state;

    console.log("render", currentAccount);

    return (
      <div className={styles.contracts}>
        <h2>My NFTs</h2>

        {allPhotos.map((photo, key) => {
          const askValueInEth = Web3.utils.fromWei(photo.askValue);
          return (
            <div key={key} style={{width : "100%"}}>
              <div className={styles.widgets} style={{display : "flex", flexDirection : "row"}}>
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

                  {/* 
                                    <p>
                                        Price:{" "}
                                        {web3.utils.fromWei(
                                            `${photo.marketData.price}`,
                                            "ether"
                                        )}{" "}
                                        ETH
                                    </p> */}

                  <p>Owner: {photo.tokenOwner}</p>
                  <p>Token ID: {photo.tokenId}</p>
                  <p>current ask price: {askValueInEth}</p>

                  <br />

                  
                  <Button
                    size={"medium"}
                    width={1}
                    mb={4}
                    // value={photo.nftData.tokenID}

                    onClick={() => this.putOnAuction(photo.tokenId)}
                  >
                    Put on Auction
                  </Button>
                 
                  {this.state.details == "auction" &&
                  this.state.tokenId == photo.tokenId ? (
                    <div>
                      <Field label="Aunction Reserve Price">
                        <Input
                          type="text"
                          width={1}
                          placeholder="Price in Eth"
                          required={true}
                          // value={this.state.valueNFTName}
                          onChange={this.handleValue}
                        />
                      </Field>
                      <Button size={"small"} mb={2} onClick = {() => this.setReservePrice()}>
                        Set Reserve Price
                      </Button>
                    </div>
                  ) : (
                    ""
                  )}
                  <Button
                    size={"medium"}
                    width={1}
                    // value={photo.nftData.tokenID}
                    onClick={() => this.putOnAsk(photo.tokenId)}
                  >
                    Put on market
                  </Button>
                  {this.state.details == "ask" &&
                  this.state.tokenId == photo.tokenId ? (
                    <div>
                      <Field label="Ask Price">
                        <Input
                          type="text"
                          width={1}
                          placeholder="Price in Eth"
                          required={true}
                          // value={this.state.valueNFTName}
                          onChange={this.handleValue}
                        />
                      </Field>
                      <Button size={"small"} mb={2} onClick = {() => this.setAskPrice()}>
                        Set Ask Price
                      </Button>
                    </div>
                  ) : (
                    ""
                  )}
                  <span style={{ padding: "5px" }}></span>
                </Card>
              </div>
            </div>
          );
        })}
        <h2>My auction NFTs</h2>
        { this.state.currentAuction && 
          this.state.currentAuction.map((photo, key) => {
            const {duration, firstBidTime, auctionId} = photo;
            let expiresAt = 0;
            if (photo && firstBidTime) expiresAt = parseInt(firstBidTime) + parseInt(duration);
            console.log('expiresAt', expiresAt)
            expiresAt -= Math.floor((new Date()).getTime() / 1000);
            console.log(expiresAt)
            if (expiresAt < 0) expiresAt = 0;
            // expiresAt = Math.floor(expiresAt / 1000);
            
            const reservePrice = (web3 && photo && photo.reservePrice) ? web3.utils.fromWei(photo.reservePrice) : 0.0
            const highestBid = (web3 && photo && photo.amount) ? web3.utils.fromWei(photo.amount) : 0.0
            return (
              <div className={styles.widgets} style={{display : "flex", flexDirection : "row"}} key = {key}>
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
                  
                    <p>AuctionID: {photo.auctionId}</p>
                    <p>Owner: {photo.tokenOwner}</p>
                    <p>Token ID: {photo.tokenId}</p>

                    <p>Reseve Value: {reservePrice}</p>
                    <p>Highest Bid : {highestBid}</p>
                    <p>Highest Bidder : {photo.bidder}</p>
                    <p>Remain Time : {expiresAt} </p>
                    <p>Status : {photo.status}</p>
                    {firstBidTime > 0 && expiresAt == 0 &&
                    (
                      <Button
                          size={"medium"}
                          width={1}
                          mb={4}
                          // value={photo.nftData.tokenID}

                          onClick={() => this.endAuction(auctionId)}
                      >
                          End Auction
                      </Button>
                    )
                    }
                    {firstBidTime == 0 &&
                    (
                      <Button
                          size={"medium"}
                          width={1}
                          mb={4}
                          // value={photo.nftData.tokenID}

                          onClick={() => this.cancelAuction(auctionId)}
                      >
                          Cancel Auction
                      </Button>
                    )
                    }
                    
                </Card>
              </div>
            )

          })
        }
      </div>
    );
  }
}
