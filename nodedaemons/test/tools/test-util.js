let util = require('../common/util.js');
const {expect} = require('chai');

describe("Test Common Util", function() {
    it("Test Convert Base16 To Base10", async function() {
         let original = "0xbb8";
         let target = util.ConvertFrom16To10(original);
         expect(target).to.equal(3000);
    });
    it("Test Convert Base10 To Base16", async function() {
        let original = 3000;
        let target = util.ConvertFrom10To16(original);
        expect(target).to.equal("0xbb8");
   });
   it("Test Convert Array To String", async function() {
        let arr = [12, 41, '4', 'address', '2018-05-04 17:18:48', 'true'];
        let target = util.ConvertArrayToString(arr);
        console.log(target)
        expect(target).to.equal("'12','41','4','address','2018-05-04 17:18:48','true'");
   });
 });