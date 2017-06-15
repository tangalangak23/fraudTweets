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
  $.post("/updateHandles",{"newHandles":handles});
  location.reload();
});

window.onclick = function (event) {
    if (event.target == $("#generalAccount")[0] ){
        $("#generalAccount").fadeOut();
    }
    else if (event.target == $("#passwordChange")[0] ){
        $("#passwordChange").fadeOut();
    }
}

$("#generalUAC").click(function(){
  $.get("/getUser",function(data){
    $("#usersName").val(data.name);
    $("#uName").val(data.uname);
    $("#email").val(data.email);
    $("#generalAccount").fadeIn();
  });
});

$("#changePassword").click(function(){
  $("#passwordChange").fadeIn();
});

$('#passwordForm').click(function(ev) {
  current=$("#current").val();
  newPass=$("#newPass").val();
  newPass2=$("#newPass2").val();
  console.log(current+newPass)
  if(current==newPass){
    $("#message").text("New password Matches old password");
  }
  else if(newPass!=newPass2){
    $("#message").text("New passwords do not match");
  }
  else{
    $("#message").text("Updating Password");
    $.post("/updatePassword",{currentPassword:current,newPassword:newPass},function(data){

    });
  }
});
