const {CalculateMedian, QuickSort} = require('../Algorithm');
const expect = require('chai').expect;

describe("Test Algorithm", function() {
   it("Test Calculate Median", function() {
       expect(CalculateMedian([12,15,17,3,9,21,19,5,41,33,26])).to.equal(17)
   });
   it("Test Quick Sort", function() {
        let array = [12,15,17,3,9,21,19,5,41,33,26];
        let result = QuickSort(array);
        expect(result).to.eql([3,5,9,12,15,17,19,21,26,33,41]);
   });
});