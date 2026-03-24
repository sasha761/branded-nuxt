import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// eslint-disable-next-line no-unused-vars
class WCApi {
  constructor({siteUrl, key, secret}) {
    this.instance = null;
    this.siteUrl = siteUrl
    this.key = key
    this.secret = secret
  }

  init() {
    this.instance = new WooCommerceRestApi({
      url: this.siteUrl,
      consumerKey: this.key,
      consumerSecret: this.secret,
      version: "wc/v3"
    });
  }
}

export default WCApi;