var handles=[];
$.get("/getHandles",function(data){
  handles=data.value;
  for(i=0;i<handles.length;i++){
    temp="<tr><td><input type='text' class='form-control' data-new='no' value='"+handles[i]+"'></td><td><input class='form-control' type='checkbox' id='"+i+"'></td></tr>";
    $("#handlesContainter").append(temp);
  }
});

$("#add").click(function(){
  temp="<tr><td><input type='text' data-new='yes' class='form-control'></td><td><input class='form-control' type='checkbox' value='new'></td></tr>";
  $("#handlesContainter").append(temp);
});

$("#update").click(function(){
  $("input").each(function(data,obj){
    type=$(obj).attr("type");
    newHandle=$(obj).attr("data-new");
    val=$(obj).val();
    if(type=="text"){
      if(newHandle=='no'){
        temp="#"+(data/2).toString();
        if($(temp).is(":checked")){
          handles.splice((data/2),1);
        }
        else{
          handles[data/2]=val;
        }
      }
      else if(val!="" && handles.indexOf(val)==-1){
        handles.push(val)
      }
    }
  });
  console.log(handles)
  $.post("/updateHandles",{"newHandles":handles});
  location.reload();
});
