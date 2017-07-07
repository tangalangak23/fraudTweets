//Function for calculating the levenshtein distane algorithm
function editDistance(st1,st2){
  var distance=[[]];
  //Initalize matrix for levenshtein costs
  for(i=0;i<=st2.length;i++){
    distance[i]=new Array(st1.length+1);
  }
  for(i=0;i<=st2.length;i++){
    distance[i][0]=i;
  }
  for(i=0;i<=st1.length;i++){
    distance[0][i]=i;
  }
  //Calculate the scores in each cell
  for(i=1;i<=st2.length;i++){
    for(j=1;j<st1.length+1;j++){
      cost=0;
      if(st1[j-1]!=st2[i-1]){
        cost=1;
      }
      temp=[];
      temp.push(distance[i-1][j]+1);
      temp.push(distance[i][j-1]+1);
      temp.push(distance[i-1][j-1]+cost);
      distance[i][j]=Math.min.apply(Math,temp);
    }
  }
  //Return the distance
	console.log(distance);
  return(distance[st2.length][st1.length]);
}

console.log(editDistance("test","sprintcare"));
