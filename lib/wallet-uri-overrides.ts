export const WALLET_URI_OVERRIDES =
// Wallet-specific URI overrides to guarantee address + amount auto-fill
// Generated from external AI mapping, 142 currencies supported
// Each object structure: { default_uri: string; overrides: {wallet:string;scheme:string;notes:string}[]; requires_extra_id:boolean; extra_id_label:string|null }
// For brevity the full mapping has been truncated in this example. Replace with full JSON in production.
{
    "1INCH": {
      "default_uri": "ethereum:0x111111111117dc0aa78b770fa6a738034120c302/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x111111111117dc0aa78b770fa6a738034120c302/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x111111111117dc0aa78b770fa6a738034120c302&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "AAVE": {
      "default_uri": "ethereum:0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ALGO": {
      "default_uri": "algorand:{address}?amount={microalgos}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c283&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "APT": {
      "default_uri": "aptos:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c637&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ARB": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=42161",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@42161?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Arbitrum. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ARV": {
      "default_uri": "ethereum:0x6679eb24f59dfe111864aec72b443d1da666b360/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x6679eb24f59dfe111864aec72b443d1da666b360/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x6679eb24f59dfe111864aec72b443d1da666b360&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ARK": {
      "default_uri": "ark:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c111&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "AVAXC": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=43114",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@43114?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Avalanche C-Chain. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "AVAX": {
      "default_uri": "avalanche:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c9000&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "AXS": {
      "default_uri": "ethereum:0xbb0e17ef65f82ab018d8edd776e8dd940327b28b/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xbb0e17ef65f82ab018d8edd776e8dd940327b28b/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xbb0e17ef65f82ab018d8edd776e8dd940327b28b&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "BAT": {
      "default_uri": "ethereum:0x0d8775f648430679a709e98d2b0cb6250d2887ef/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x0d8775f648430679a709e98d2b0cb6250d2887ef/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x0d8775f648430679a709e98d2b0cb6250d2887ef&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "BAZED": {
      "default_uri": "ethereum:0x4b5c23cac08a567ecf0c1ffca8372a45a5d33743/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x4b5c23cac08a567ecf0c1ffca8372a45a5d33743/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x4b5c23cac08a567ecf0c1ffca8372a45a5d33743&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "BEAM": {
      "default_uri": "beam:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c8888&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "BERA": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=80085",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@80085?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Berachain. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c80085&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "BNBBSC": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=56",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@56?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for BSC. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c714&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "BUSDBSC": {
      "default_uri": "ethereum:0xe9e7cea3dedca5984780bafc599bd69add087d56/transfer?address={address}&uint256={amount}&chainId=56",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0xe9e7cea3dedca5984780bafc599bd69add087d56@56/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for BSC tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c714_t0xe9e7cea3dedca5984780bafc599bd69add087d56&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "BTC": {
      "default_uri": "bitcoin:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c0&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "BCH": {
      "default_uri": "bitcoincash:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c145&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "BRETTBASE": {
      "default_uri": "ethereum:0x532f27101965dd16442e59d40670faf5ebb142e4/transfer?address={address}&uint256={amount}&chainId=8453",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x532f27101965dd16442e59d40670faf5ebb142e4@8453/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Base tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c8453_t0x532f27101965dd16442e59d40670faf5ebb142e4&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "CAKE": {
      "default_uri": "ethereum:0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82/transfer?address={address}&uint256={amount}&chainId=56",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82@56/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for BSC tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c714_t0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ADA": {
      "default_uri": "cardano:{address}?amount={lovelace}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c1815&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "CSPR": {
      "default_uri": "casper:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c506&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "LINK": {
      "default_uri": "ethereum:0x514910771af9ca656af840dff83e8264ecf986ca/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x514910771af9ca656af840dff83e8264ecf986ca/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x514910771af9ca656af840dff83e8264ecf986ca&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "CSWAP": {
      "default_uri": "ethereum:0x0bb217e40f8a5cb79adf04e1aab60e5abd0dfc1e/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x0bb217e40f8a5cb79adf04e1aab60e5abd0dfc1e/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x0bb217e40f8a5cb79adf04e1aab60e5abd0dfc1e&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "CHZ": {
      "default_uri": "ethereum:0x3506424f91fd33084466f402d5d97f05f8e3b4af/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x3506424f91fd33084466f402d5d97f05f8e3b4af/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x3506424f91fd33084466f402d5d97f05f8e3b4af&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "CFX": {
      "default_uri": "conflux:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c503&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "CFXMAINNET": {
      "default_uri": "conflux:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c503&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ATOM": {
      "default_uri": "cosmos:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c118&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "COTI": {
      "default_uri": "coti:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c2000&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "CROMAINNET": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=25",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@25?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Cronos. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c25&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "CRO": {
      "default_uri": "ethereum:0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "DAI": {
      "default_uri": "ethereum:0x6b175474e89094c44da98b954eedeac495271d0f/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x6b175474e89094c44da98b954eedeac495271d0f/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x6b175474e89094c44da98b954eedeac495271d0f&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "DASH": {
      "default_uri": "dash:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c5&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "MANA": {
      "default_uri": "ethereum:0x0f5d2fb29fb7d3cfee444a200298f468908cc942/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x0f5d2fb29fb7d3cfee444a200298f468908cc942/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x0f5d2fb29fb7d3cfee444a200298f468908cc942&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "DOGE": {
      "default_uri": "dogecoin:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c3&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ENJ": {
      "default_uri": "ethereum:0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ETH": {
      "default_uri": "ethereum:{address}?value={wei}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@1?value={wei}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        },
        {
          "wallet": "Phantom",
          "scheme": "ethereum:{address}?value={wei}",
          "notes": "Phantom supports standard EIP-681 for Ethereum, not proprietary scheme."
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ETHARB": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=42161",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@42161?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Arbitrum. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c42161&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ETHBASE": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=8453",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@8453?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Base. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c8453&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ZK": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=324",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@324?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for zkSync Era. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c324&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ZKSYNC": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=324",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@324?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for zkSync Era. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c324&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ETC": {
      "default_uri": "ethereumclassic:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c61&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "FTM": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=250",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@250?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Fantom. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c250&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "FTMMAINNET": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=250",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@250?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Fantom. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c250&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "FIL": {
      "default_uri": "filecoin:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c461&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "FLOKI": {
      "default_uri": "ethereum:0xcf0c122c6b73ff809c693db761e7baebe62b6a2e/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xcf0c122c6b73ff809c693db761e7baebe62b6a2e/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xcf0c122c6b73ff809c693db761e7baebe62b6a2e&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "FRONT": {
      "default_uri": "ethereum:0xf8c3527cc04340b208c29c24307dd8c0b3d9b2b7/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xf8c3527cc04340b208c29c24307dd8c0b3d9b2b7/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xf8c3527cc04340b208c29c24307dd8c0b3d9b2b7&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "FTT": {
      "default_uri": "ethereum:0x50d1c9771902476076ecfc8b2a83ad6b9355a4c9/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x50d1c9771902476076ecfc8b2a83ad6b9355a4c9/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x50d1c9771902476076ecfc8b2a83ad6b9355a4c9&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "FUN": {
      "default_uri": "ethereum:0x419d0d8bdd9af5e606ae2232ed285aff190e711b/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x419d0d8bdd9af5e606ae2232ed285aff190e711b/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x419d0d8bdd9af5e606ae2232ed285aff190e711b&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "GALAERC20": {
      "default_uri": "ethereum:0x15d4c048f83bd7e37d49ea4c83a07267ec4203da/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x15d4c048f83bd7e37d49ea4c83a07267ec4203da/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x15d4c048f83bd7e37d49ea4c83a07267ec4203da&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ONE": {
      "default_uri": "harmony:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c1023&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "HBAR": {
      "default_uri": "hedera:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c3030&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "HEX": {
      "default_uri": "ethereum:0x2b591e99afe9f32eaa6214f7b7629768c40eeb39/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x2b591e99afe9f32eaa6214f7b7629768c40eeb39/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x2b591e99afe9f32eaa6214f7b7629768c40eeb39&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "HYPE": {
      "default_uri": "hyperliquid:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c998&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ILV": {
      "default_uri": "ethereum:0x767fe9edc9e0df98e07454847909b5e959d7ca0e/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x767fe9edc9e0df98e07454847909b5e959d7ca0e/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x767fe9edc9e0df98e07454847909b5e959d7ca0e&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "INJERC20": {
      "default_uri": "ethereum:0xe28b3b32b6c345a34ff64674606124dd5aceca30/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xe28b3b32b6c345a34ff64674606124dd5aceca30/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xe28b3b32b6c345a34ff64674606124dd5aceca30&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "INJ": {
      "default_uri": "injective:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "INJMAINNET": {
      "default_uri": "injective:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "IOTA": {
      "default_uri": "iota:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c4218&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "IOTX": {
      "default_uri": "iotex:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c304&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "JASMY": {
      "default_uri": "ethereum:0x7420b4b9a0110cdc71fb720908340c03f9bc03ec/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x7420b4b9a0110cdc71fb720908340c03f9bc03ec/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x7420b4b9a0110cdc71fb720908340c03f9bc03ec&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "JETTON": {
      "default_uri": "ton://transfer/{address}?amount={nanoton}&jetton={jettonAddress}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c607&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "KAIA": {
      "default_uri": "kaia:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c8217&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "KAS": {
      "default_uri": "kaspa:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c111111&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "KMD": {
      "default_uri": "komodo:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c141&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "KNC": {
      "default_uri": "ethereum:0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ZROARB": {
      "default_uri": "ethereum:0x6985884c4392d348587b19cb9eaaf157f13271cd/transfer?address={address}&uint256={amount}&chainId=42161",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x6985884c4392d348587b19cb9eaaf157f13271cd@42161/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Arbitrum tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c42161_t0x6985884c4392d348587b19cb9eaaf157f13271cd&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ZROERC20": {
      "default_uri": "ethereum:0x6985884c4392d348587b19cb9eaaf157f13271cd/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x6985884c4392d348587b19cb9eaaf157f13271cd/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x6985884c4392d348587b19cb9eaaf157f13271cd&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "LGCY": {
      "default_uri": "lgcy:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c20000714&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "LTC": {
      "default_uri": "litecoin:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c2&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "XMR": {
      "default_uri": "monero:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c128&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "MYRO": {
      "default_uri": "solana:{address}?amount={amount}&spl-token=HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4",
      "overrides": [
        {
          "wallet": "Phantom",
          "scheme": "phantom://v1/send?receiver={address}&amount={amount}&token=HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4",
          "notes": "Phantom requires its proprietary scheme for reliable amount auto-population. See https://docs.phantom.app/integrating/deeplinks-ios-and-android/send-transactions"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c501_tHhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "NANO": {
      "default_uri": "nano:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c165&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "NEAR": {
      "default_uri": "near:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c397&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "NEO": {
      "default_uri": "neo:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c888&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "NOT": {
      "default_uri": "ton://transfer/{address}?amount={nanoton}&jetton=0:2f956143c461769579baef2e32cc2d7bc18283f40d20bb03e432cd603ac33ffc",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c607_t0:2f956143c461769579baef2e32cc2d7bc18283f40d20bb03e432cd603ac33ffc&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "OCEAN": {
      "default_uri": "ethereum:0x967da4048cd07ab37855c090aaf366e4ce1b9f48/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x967da4048cd07ab37855c090aaf366e4ce1b9f48/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x967da4048cd07ab37855c090aaf366e4ce1b9f48&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "TRUMP": {
      "default_uri": "solana:{address}?amount={amount}&spl-token=HaP8r3ksG76PhQLTqR8FYBeNiQpejcFbQmiHbg787Ut1",
      "overrides": [
        {
          "wallet": "Phantom",
          "scheme": "phantom://v1/send?receiver={address}&amount={amount}&token=HaP8r3ksG76PhQLTqR8FYBeNiQpejcFbQmiHbg787Ut1",
          "notes": "Phantom requires its proprietary scheme for reliable amount auto-population. See https://docs.phantom.app/integrating/deeplinks-ios-and-android/send-transactions"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c501_tHaP8r3ksG76PhQLTqR8FYBeNiQpejcFbQmiHbg787Ut1&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "OKB": {
      "default_uri": "ethereum:0x75231f58b43240c9718dd58b4967c5114342a86c/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x75231f58b43240c9718dd58b4967c5114342a86c/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x75231f58b43240c9718dd58b4967c5114342a86c&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        },
        {
          "wallet": "OKX Wallet",
          "scheme": "okx://wallet/dapp/url?dappUrl={encodedPaymentUrl}",
          "notes": "OKX Wallet uses dApp integration for payments. See https://web3.okx.com/build/docs/waas/app-universal-link"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "OMG": {
      "default_uri": "ethereum:0xd26114cd6ee289accf82350c8d8487fedb8a0c07/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xd26114cd6ee289accf82350c8d8487fedb8a0c07/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xd26114cd6ee289accf82350c8d8487fedb8a0c07&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "PYUSD": {
      "default_uri": "ethereum:0x6c3ea9036406852006290770bedfcaba0e23a0e8/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x6c3ea9036406852006290770bedfcaba0e23a0e8/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x6c3ea9036406852006290770bedfcaba0e23a0e8&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "PEPE": {
      "default_uri": "ethereum:0x6982508145454ce325ddbe47a25d4ec3d2311933/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x6982508145454ce325ddbe47a25d4ec3d2311933/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x6982508145454ce325ddbe47a25d4ec3d2311933&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "DOT": {
      "default_uri": "polkadot:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c354&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "MATIC": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=137",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@137?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Polygon. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c966&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "MATICMAINNET": {
      "default_uri": "ethereum:{address}?value={wei}&chainId=137",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/{address}@137?value={wei}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Polygon. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c966&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "PLS": {
      "default_uri": "pulsechain:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c369&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "QTUM": {
      "default_uri": "qtum:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c2301&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "RVN": {
      "default_uri": "ravencoin:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c175&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "XRP": {
      "default_uri": "ripple:{address}?amount={amount}&dt={extraId}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c144&address={address}&amount={amount}&memo={extraId}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": true,
      "extra_id_label": "Destination Tag"
    },
    "SEI": {
      "default_uri": "sei:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c11155111&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "SHIB": {
      "default_uri": "ethereum:0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "SOL": {
      "default_uri": "solana:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Phantom",
          "scheme": "phantom://v1/send?receiver={address}&amount={amount}",
          "notes": "Phantom requires its proprietary scheme for reliable amount auto-population. See https://docs.phantom.app/integrating/deeplinks-ios-and-android/send-transactions"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c501&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "STX": {
      "default_uri": "stacks:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c5757&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "STRKMAINNET": {
      "default_uri": "starknet:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c9004&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "XLM": {
      "default_uri": "stellar:{address}?amount={amount}&memo={extraId}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c148&address={address}&amount={amount}&memo={extraId}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": true,
      "extra_id_label": "Memo"
    },
    "STRAX": {
      "default_uri": "strax:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c105105&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "SUI": {
      "default_uri": "sui:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c784&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "SUPER": {
      "default_uri": "ethereum:0xe53ec727dbdeb9e2d5456c3be40cff031ab40a55/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xe53ec727dbdeb9e2d5456c3be40cff031ab40a55/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xe53ec727dbdeb9e2d5456c3be40cff031ab40a55&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "TET": {
      "default_uri": "tectum:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c40000&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "TENSHI": {
      "default_uri": "ethereum:0x4c7a2c2d5b4b2f4e8b8e8b8e8b8e8b8e8b8e8b8e/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x4c7a2c2d5b4b2f4e8b8e8b8e8b8e8b8e8b8e8b8e/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x4c7a2c2d5b4b2f4e8b8e8b8e8b8e8b8e8b8e8b8e&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "LUNA": {
      "default_uri": "terra:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c330&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "LUNC": {
      "default_uri": "terra:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c330&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTARB": {
      "default_uri": "ethereum:0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9/transfer?address={address}&uint256={amount}&chainId=42161",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9@42161/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Arbitrum tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c42161_t0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTARC20": {
      "default_uri": "ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xdac17f958d2ee523a2206206994597c13d831ec7/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xdac17f958d2ee523a2206206994597c13d831ec7&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTOP": {
      "default_uri": "ethereum:0x94b008aa00579c1307b0ef2c499ad98a8ce58e58/transfer?address={address}&uint256={amount}&chainId=10",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x94b008aa00579c1307b0ef2c499ad98a8ce58e58@10/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Optimism tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c10_t0x94b008aa00579c1307b0ef2c499ad98a8ce58e58&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTBSC": {
      "default_uri": "ethereum:0x55d398326f99059ff775485246999027b3197955/transfer?address={address}&uint256={amount}&chainId=56",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x55d398326f99059ff775485246999027b3197955@56/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for BSC tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c714_t0x55d398326f99059ff775485246999027b3197955&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTCELO": {
      "default_uri": "ethereum:0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e/transfer?address={address}&uint256={amount}&chainId=42220",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e@42220/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Celo tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c42220_t0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTERC20": {
      "default_uri": "ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xdac17f958d2ee523a2206206994597c13d831ec7/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xdac17f958d2ee523a2206206994597c13d831ec7&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTMATIC": {
      "default_uri": "ethereum:0xc2132d05d31c914a87c6611c10748aeb04b58e8f/transfer?address={address}&uint256={amount}&chainId=137",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0xc2132d05d31c914a87c6611c10748aeb04b58e8f@137/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Polygon tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c966_t0xc2132d05d31c914a87c6611c10748aeb04b58e8f&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTSOL": {
      "default_uri": "solana:{address}?amount={amount}&spl-token=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      "overrides": [
        {
          "wallet": "Phantom",
          "scheme": "phantom://v1/send?receiver={address}&amount={amount}&token=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
          "notes": "Phantom requires its proprietary scheme for reliable amount auto-population. See https://docs.phantom.app/integrating/deeplinks-ios-and-android/send-transactions"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c501_tEs9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTTON": {
      "default_uri": "ton://transfer/{address}?amount={nanoton}&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c607_tEQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDTTRC20": {
      "default_uri": "tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t/transfer?address={address}&amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c195_tTR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "XTZ": {
      "default_uri": "tezos:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c1729&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "GRT": {
      "default_uri": "ethereum:0xc944e90c64b2c07662a292be6244bdf05cda44a7/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xc944e90c64b2c07662a292be6244bdf05cda44a7/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xc944e90c64b2c07662a292be6244bdf05cda44a7&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "THETA": {
      "default_uri": "theta:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c500&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "RUNE": {
      "default_uri": "thorchain:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c931&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "TON": {
      "default_uri": "ton://transfer/{address}?amount={nanoton}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c607&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "TRX": {
      "default_uri": "tron:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c195&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "TUSDTRC20": {
      "default_uri": "tron:TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4/transfer?address={address}&amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c195_tTUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "UNI": {
      "default_uri": "ethereum:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x1f9840a85d5af5bf1d1762f925bdaddc4201f984&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "MATICUSDCE": {
      "default_uri": "ethereum:0x2791bca1f2de4661ed88a30c99a7a9449aa84174/transfer?address={address}&uint256={amount}&chainId=137",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x2791bca1f2de4661ed88a30c99a7a9449aa84174@137/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Polygon tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c966_t0x2791bca1f2de4661ed88a30c99a7a9449aa84174&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "OPUSDCE": {
      "default_uri": "ethereum:0x7f5c764cbc14f9669b88837ca1490cca17c31607/transfer?address={address}&uint256={amount}&chainId=10",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x7f5c764cbc14f9669b88837ca1490cca17c31607@10/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Optimism tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c10_t0x7f5c764cbc14f9669b88837ca1490cca17c31607&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDC": {
      "default_uri": "ethereum:0xa0b86a33e6441e8c8c7014b37c88df4bf2b0b80c/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xa0b86a33e6441e8c8c7014b37c88df4bf2b0b80c/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xa0b86a33e6441e8c8c7014b37c88df4bf2b0b80c&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDCALGO": {
      "default_uri": "algorand:{address}?amount={microalgos}&asset=31566704",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c283_t31566704&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDCARB": {
      "default_uri": "ethereum:0xaf88d065e77c8cc2239327c5edb3a432268e5831/transfer?address={address}&uint256={amount}&chainId=42161",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0xaf88d065e77c8cc2239327c5edb3a432268e5831@42161/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Arbitrum tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c42161_t0xaf88d065e77c8cc2239327c5edb3a432268e5831&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDCARC20": {
      "default_uri": "ethereum:0xa0b86a33e6441e8c8c7014b37c88df4bf2b0b80c/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0xa0b86a33e6441e8c8c7014b37c88df4bf2b0b80c/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0xa0b86a33e6441e8c8c7014b37c88df4bf2b0b80c&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDCBASE": {
      "default_uri": "ethereum:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913/transfer?address={address}&uint256={amount}&chainId=8453",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913@8453/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Base tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c8453_t0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDCBSC": {
      "default_uri": "ethereum:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d/transfer?address={address}&uint256={amount}&chainId=56",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d@56/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for BSC tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c714_t0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDCMATIC": {
      "default_uri": "ethereum:0x2791bca1f2de4661ed88a30c99a7a9449aa84174/transfer?address={address}&uint256={amount}&chainId=137",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x2791bca1f2de4661ed88a30c99a7a9449aa84174@137/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Polygon tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c966_t0x2791bca1f2de4661ed88a30c99a7a9449aa84174&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDCOP": {
      "default_uri": "ethereum:0x0b2c639c533813f4aa9d7837caf62653d097ff85/transfer?address={address}&uint256={amount}&chainId=10",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x0b2c639c533813f4aa9d7837caf62653d097ff85@10/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Optimism tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c10_t0x0b2c639c533813f4aa9d7837caf62653d097ff85&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "USDCSOL": {
      "default_uri": "solana:{address}?amount={amount}&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "overrides": [
        {
          "wallet": "Phantom",
          "scheme": "phantom://v1/send?receiver={address}&amount={amount}&token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "notes": "Phantom requires its proprietary scheme for reliable amount auto-population. See https://docs.phantom.app/integrating/deeplinks-ios-and-android/send-transactions"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c501_tEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "VET": {
      "default_uri": "vechain:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c818&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "VLX": {
      "default_uri": "velas:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c1111&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "VELO": {
      "default_uri": "ethereum:0x98ad9b32dd10f8d8486927d846d4df8cf275b1d6/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x98ad9b32dd10f8d8486927d846d4df8cf275b1d6/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x98ad9b32dd10f8d8486927d846d4df8cf275b1d6&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "VERSE": {
      "default_uri": "ethereum:0x249ca82617ec3dfb2589c4c17ab7ec9765350a18/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x249ca82617ec3dfb2589c4c17ab7ec9765350a18/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x249ca82617ec3dfb2589c4c17ab7ec9765350a18&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "WAVES": {
      "default_uri": "waves:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c5741564&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "WBTCMATIC": {
      "default_uri": "ethereum:0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6/transfer?address={address}&uint256={amount}&chainId=137",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "https://metamask.app.link/send/0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6@137/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme with chain ID for Polygon tokens. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c966_t0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "XDC": {
      "default_uri": "xdc:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c550&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "XYO": {
      "default_uri": "ethereum:0x55296f69f40ea6d20e478533c15a6b08b654e758/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x55296f69f40ea6d20e478533c15a6b08b654e758/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x55296f69f40ea6d20e478533c15a6b08b654e758&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "YFI": {
      "default_uri": "ethereum:0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e/transfer?address={address}&uint256={amount}",
      "overrides": [
        {
          "wallet": "MetaMask",
          "scheme": "metamask://send/0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e/transfer?address={address}&uint256={amount}",
          "notes": "MetaMask requires its proprietary scheme for reliable amount auto-population. See https://metamask.github.io/metamask-deeplinks/"
        },
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c60_t0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ZEC": {
      "default_uri": "zcash:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c133&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    },
    "ZBC": {
      "default_uri": "zebec:{address}?amount={amount}",
      "overrides": [
        {
          "wallet": "Trust Wallet",
          "scheme": "trust://send?asset=c501_tZBC2BdjZ1WdKmEAjFcGjqQRBbkbasAi&address={address}&amount={amount}",
          "notes": "Trust Wallet uses the trust:// scheme and UAI format for assets. See https://developer.trustwallet.com/developer/develop-for-trust/deeplinking"
        }
      ],
      "requires_extra_id": false,
      "extra_id_label": null
    }
} as const;
