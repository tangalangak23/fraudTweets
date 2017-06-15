//Levinshtein distance aka edit distance calculator

function editDistance(st1,st2){
  var results=[[]];
  for(i=0;i<=st2.length;i++){
    results[i]=new Array(st1.length+1);
  }
  for(i=0;i<=st2.length;i++){
    results[i][0]=i;
  }
  for(i=0;i<=st1.length;i++){
    results[0][i]=i;
  }


  for(i=1;i<=st1.length+1;i++){
    for(j=1;j<st2.length;j++){
      cost=0;
      if(st1[i-1]!=st2[j-1]){
        cost=1;
      }
      temp=[];
      temp.push(results[i-1][j]+1);
      temp.push(results[i][j-1]+1);
      temp.push(results[i-1][j-1]+cost);
      results[i][j]=Math.min(...temp);
    }
  }
  return(results[st1.length-1][st2.length-1]);
}

var i=editDistance("GUMBO","GAMBOL");
console.log(i);