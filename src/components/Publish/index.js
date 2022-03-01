import React, { Component } from "react";
import getWeb3, { getGanacheWeb3, Web3 } from "../../utils/getWeb3";
import ipfs from "../ipfs/ipfsApi.js";

import { Grid } from "@material-ui/core";
import {
    Loader,
    Button,
    Card,
    Input,
    Heading,
    Table,
    Form,
    Field,
} from "rimble-ui";
import { zeppelinSolidityHotLoaderOptions } from "../../../config/webpack";

import styles from "../../App.module.scss";

export default class Publish extends Component {
    constructor(props) {
        super(props);

        this.state = {
            /////// Default state
            storageValue: 0,
            web3: null,
            accounts: null,
            route: window.location.pathname.replace("/", ""),

            /////// NFT concern
            valueNFTName: "",
            valueNFTSymbol: "",
            valuePhotoPrice: "",
            photoNFT: null,

            /////// Ipfs Upload
            buffer: null,
            ipfsHash: "",
        };

        /////// Handle
        this.handleNFTName = this.handleNFTName.bind(this);
        this.handleNFTSymbol = this.handleNFTSymbol.bind(this);
        this.handlePhotoPrice = this.handlePhotoPrice.bind(this);

        /////// Ipfs Upload
        this.captureFile = this.captureFile.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    ///--------------------------
    /// Handler
    ///--------------------------
    handleNFTName(event) {
        this.setState({ valueNFTName: event.target.value });
    }

    handleNFTSymbol(event) {
        this.setState({ valueNFTSymbol: event.target.value });
    }

    handlePhotoPrice(event) {
        this.setState({ valuePhotoPrice: event.target.value });
    }

    ///--------------------------
    /// Functions of ipfsUpload
    ///--------------------------
    captureFile(event) {
        event.preventDefault();
        const file = event.target.files[0];

        const reader = new window.FileReader();
        reader.readAsArrayBuffer(file); // Read bufffered file

        // Callback
        reader.onloadend = () => {
            this.setState({ buffer: Buffer(reader.result) });
            console.log("=== buffer ===", this.state.buffer);
        };
    }

    async onSubmit(event) {
        const {
            web3,
            accounts,
            photoNFT,
            valueNFTName,
            valueNFTSymbol,
            valuePhotoPrice,
            photoMarketplace, 
            marketplaceAddress
        } = this.state;

        console.log("====photoNFT", photoNFT);

        event.preventDefault();

        try {
            const saveImageResult = await ipfs.files.add(this.state.buffer);

            console.log(saveImageResult);

            const imageHash = saveImageResult[0].hash;

            const nftContent = {
                // ": "No time to explain!",
                nftName: valueNFTName,
                nftSymbol: valueNFTSymbol,
                image: imageHash,
            };
            
            const cid = await ipfs.files.add(
                Buffer.from(JSON.stringify(nftContent))
            );

            console.log("cid is", cid);

            const photoPrice = web3.utils.toWei(valuePhotoPrice, "ether");
            const nftMintResult = await photoNFT.methods
                .mint(cid[0].hash, photoPrice, valueNFTName)
                .send({ from: accounts[0] });
            console.log('nftMint Result', nftMintResult);

            const tokenId = nftMintResult.events.NFTMinted.returnValues.tokenId;

            console.log('tokenId', tokenId);

            await photoNFT.methods.approve(marketplaceAddress, tokenId).send({from : accounts[0]});
            const txReceipt2 = await photoMarketplace.methods
                .openTrade(tokenId, photoPrice)
                .send({ from: accounts[0] });
                
            console.log("=== response of openTrade ===", txReceipt2);


        } catch (e) {
            console.log(e);
        }

        // ipfs.files.add(this.state.buffer, (error, result) => {
        //     // In case of fail to upload to IPFS

        //     console.log("add function");

        //     if (error) {
        //         console.log("error", error);
        //         console.error(error);
        //         return;
        //     }

        //     // In case of successful to upload to IPFS
        //     this.setState({ ipfsHash: result[0].hash });
        //     console.log("=== ipfsHash ===", this.state.ipfsHash);

        //     const nftName = valueNFTName;
        //     const nftSymbol = "NFT-MARKETPLACE"; /// [Note]: All NFT's symbol are common symbol
        //     //const nftSymbol = valueNFTSymbol;
        //     const _photoPrice = valuePhotoPrice;
        //     console.log("=== nftName ===", nftName);
        //     console.log("=== nftSymbol ===", nftSymbol);
        //     console.log("=== _photoPrice ===", _photoPrice);
        //     this.setState({
        //         valueNFTName: "",
        //         valueNFTSymbol: "",
        //         valuePhotoPrice: "",
        //     });

        //     //let PHOTO_NFT;  /// [Note]: This is a photoNFT address created
        //     const photoPrice = web3.utils.toWei(_photoPrice, "ether");
        //     const ipfsHashOfPhoto = this.state.ipfsHash;
        //     photoNFT.methods
        //         .mint(
        //           ipfsHashOfPhoto,
        //           photoPrice,
        //           nftName
        //         )
        //         .send({ from: accounts[0] })
        //         .once("receipt", (receipt) => {
        //             console.log("=== receipt ===", receipt);

        //             /// Check owner of photoId
        //             const photoId = receipt.events.PhotoNFTCreated.returnValues.photoId;
        //             console.log('====photoId ====', photoId)

        //             /// [Note]: Promise (nested-structure) is needed for executing those methods below (Or, rewrite by async/await)
        //             photoNFT.methods.openTrade(photoId).send({from : accounts[0]})
        //                 .once("receipt", (receipt) => {
        //                     console.log('===openTrade=====', receipt);
        //                 });
        //         });
        // });
    }

    ////////////////////////////////////
    /// Ganache
    ////////////////////////////////////
    getGanacheAddresses = async () => {
        if (!this.ganacheProvider) {
            this.ganacheProvider = getGanacheWeb3();
        }
        if (this.ganacheProvider) {
            return await this.ganacheProvider.eth.getAccounts();
        }
        return [];
    };

    componentDidMount = async () => {
        const hotLoaderDisabled = zeppelinSolidityHotLoaderOptions.disabled;

        let PhotoNFT = {};
        let PhotoMarketplace = {};
        try {
            PhotoNFT = require("../../../../build/contracts/PhotoNFT.json"); 
            PhotoMarketplace = require("../../../../build/contracts/PhotoMarketplace.json"); 
        } catch (e) {
            console.log(e);
        }

        try {
            const isProd = process.env.NODE_ENV === "production";
            if (!isProd) {
                // Get network provider and web3 instance.
                const web3 = await getWeb3();
                let ganacheAccounts = [];

                try {
                    ganacheAccounts = await this.getGanacheAddresses();
                } catch (e) {
                    console.log("Ganache is not running");
                }

                // Use web3 to get the user's accounts.
                const accounts = await web3.eth.getAccounts();
                const currentAccount = accounts[0];

                // Get the contract instance.
                const networkId = await web3.eth.net.getId();
                const networkType = await web3.eth.net.getNetworkType();
                const isMetaMask = web3.currentProvider.isMetaMask;
                let balance =
                    accounts.length > 0
                        ? await web3.eth.getBalance(accounts[0])
                        : web3.utils.toWei("0");
                balance = web3.utils.fromWei(balance, "ether");

                let instancePhotoNFT = null;
                let deployedNetwork = null;

                let instancePhotoMarketplace = null;

                let marketplaceAddress = null;

                // Create instance of contracts
                if (PhotoNFT.networks) {
                    deployedNetwork = PhotoNFT.networks[networkId.toString()];
                    if (deployedNetwork) {
                        instancePhotoNFT = new web3.eth.Contract(
                            PhotoNFT.abi,
                            deployedNetwork && deployedNetwork.address
                        );
                        console.log(
                            "=== instancePhotoNFT ===",
                            instancePhotoNFT
                        );
                    }
                }

                if (PhotoMarketplace.networks) {
                    deployedNetwork = PhotoMarketplace.networks[networkId.toString()];
                    if (deployedNetwork) {
                        instancePhotoMarketplace = new web3.eth.Contract(
                            PhotoMarketplace.abi,
                            deployedNetwork && deployedNetwork.address
                        );
                        marketplaceAddress = deployedNetwork.address;
                        console.log(
                            "=== instancePhotoMarketplace ===",
                            instancePhotoMarketplace
                        );
                    }
                }

                
                if (instancePhotoNFT && instancePhotoMarketplace) {
                    // Set web3, accounts, and contract to the state, and then proceed with an
                    // example of interacting with the contract's methods.
                    this.setState(
                        {
                            web3,
                            ganacheAccounts,
                            accounts,
                            balance,
                            networkId,
                            networkType,
                            hotLoaderDisabled,
                            isMetaMask,
                            photoNFT: instancePhotoNFT,
                            photoMarketplace : instancePhotoMarketplace, 
                            currentAccount, 
                            marketplaceAddress
                        },
                        () => {
                            this.refreshValues(instancePhotoNFT);
                            setInterval(() => {
                                this.refreshValues(instancePhotoNFT);
                            }, 5000);
                        }
                    );
                } else {
                    this.setState({
                        web3,
                        ganacheAccounts,
                        accounts,
                        balance,
                        networkId,
                        networkType,
                        hotLoaderDisabled,
                        isMetaMask,
                    });
                }
            }
            ///@dev - NFT（Always load listed NFT data
            // await this.getAllPhotos();
            // this.setState({ allPhotos: allPhotos })
        } catch (error) {
            // Catch any errors for any of the above operations.
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

    refreshValues = (instancePhotoNFT) => {
        if (instancePhotoNFT) {
            console.log("refreshValues of instancePhotoNFT");
        }
    };

    render() {
        return (
            <div className={styles.left}>
                <Grid container style={{ marginTop: 20 }}>
                    <Grid item xs={10}>
                        <Card
                            width={"420px"}
                            maxWidth={"420px"}
                            mx={"auto"}
                            my={5}
                            p={20}
                            borderColor={"#E8E8E8"}
                        >
                            <h2>Publish and Put on Sale</h2>
                            <p>
                                Please upload your photo and put on sale from
                                here!
                            </p>

                            <Form onSubmit={this.onSubmit}>
                                <Field label="Photo NFT Name">
                                    <Input
                                        type="text"
                                        width={1}
                                        placeholder="e.g) Art NFT Token"
                                        required={true}
                                        value={this.state.valueNFTName}
                                        onChange={this.handleNFTName}
                                    />
                                </Field>

                                {/*
                                <Field label="Photo NFT Symbol">
                                    <Input
                                        type="text"
                                        width={1}
                                        placeholder="e.g) ARNT"
                                        required={true}
                                        value={this.state.valueNFTSymbol} 
                                        onChange={this.handleNFTSymbol}                                        
                                    />
                                </Field>
                                */}

                                <Field label="Photo Price (unit: ETH)">
                                    <Input
                                        type="text"
                                        width={1}
                                        placeholder="e.g) 10"
                                        required={true}
                                        value={this.state.valuePhotoPrice}
                                        onChange={this.handlePhotoPrice}
                                    />
                                </Field>

                                <Field label="Photo for uploading to IPFS">
                                    <input
                                        type="file"
                                        onChange={this.captureFile}
                                        required={true}
                                    />
                                </Field>

                                <Button size={"medium"} width={1} type="submit">
                                    Upload my photo and put on sale
                                </Button>
                            </Form>
                        </Card>
                    </Grid>

                    <Grid item xs={1}></Grid>

                    <Grid item xs={1}></Grid>
                </Grid>
            </div>
        );
    }
}
