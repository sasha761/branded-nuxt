export default {
  data() {
    return {
      requestInProgress: false
    }
  },

  methods: {
    waitRequest(callBack) {
      if (this.requestInProgress) return;

      this.requestInProgress = true;
      
      return callBack().finally(() => {this.requestInProgress = false})
    }
  }
}