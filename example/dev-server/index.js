const Node = require("../../");

const node = new Node({
  genBlockManually: true,
  killPortProcess: true,
  devServer: true
});

// const SEED = "ankle hedgehog attack fatal label blame shoe bulb subject negative cruise sick";

(async function() {
  await node
    .start({
      accounts: [
        {
          secretKey:
            "0x21041DD5AEBE8CD184965BA4AAE490F3B0C2500D87306FE9F32E276757BFDA68",
          balance: 1e23
        },
        {
          secretKey:
            "0x32A0D91B3930E625501C11F959BCBA312121A181C315751EA219813EDB0822A3",
          balance: 1e20
        }
      ]
    })
    .catch(err => {
      throw err;
    });
})();
