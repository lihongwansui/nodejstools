// let GetMedian = function(arr, left, right) {
//     var len = arr.length,
//     left = !left ? 0 : left,
//     right = !right ? len - 1 : right;
//     if (left < right) {
//         partitionIndex = Partition(arr, left, right);
//         if (partitionIndex > Math.floor(arr.length/2)) {
//             return GetMedian(arr, left, partitionIndex-1);
//         } else if (partitionIndex < Math.floor(arr.length/2)) {
//             return GetMedian(arr,  partitionIndex+1, right);
//         }  else {
//             return arr[partitionIndex]
//         }
//     } else if (left > right) {
//         console.log("The right is bigger than the left.");
//     } else {
//         return arr[left];
//     }
// }

// let Partition = function(arr, left ,right) {     //分区操作
//     var pivot = left,                      //设定基准值（pivot）
//         index = pivot + 1;
//     for (var i = index; i <= right; i++) {
//         if (arr[i] < arr[pivot]) {
//             Swap(arr, i, index);
//             index++;
//         }        
//     }
//     Swap(arr, pivot, index - 1);
//     return index-1;
// }

// let Swap = function(arr, i, j) {
//     var temp = arr[i];
//     arr[i] = arr[j];
//     arr[j] = temp;
// }

// let arr = [12,23,15,17,4,8,10,19];
// var result = GetMedian(arr, 0 , arr.length);

// //let median = Math.floor(arr.length/2);
// console.log(result);


const {CalculateMedian} = require('../Algorithm');

let arr = [12,15,17,3,9,21,19,5,41,33,26];

var result = CalculateMedian(arr);

console.log(result);
