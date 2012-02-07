$(document).ready(function() {
	
	$("#back").on("click", function(event){
		handleBack();
	});
	
	$("#layout").on("click", function(event){
		alert("Layout!");
	});
	
	$("#save").on("click", function(event){
		alert("Save!");
	});
	
	$("#next").on("click", function(event){
		handleNext();
	});
	
	/*
	$(document).keydown(function(e){
		alert( "keycode = " + e.keyCode);
		return false;
	});
	*/

	$(document).keydown(function(e){
		// left arrow
		if (e.keyCode == 37) { 
		   handleBack();
		   return false;
		}
		
		// presenter back / page up
		if (e.keyCode == 33) { 
		   handleBack();
		   return false;
		}
		
		// right arrow
		if (e.keyCode == 39) { 
		   handleNext();
		   return false;
		}
		
		// presenter forward / page down
		if (e.keyCode == 34) { 
		   handleNext();
		   return false;
		}
		
		// up arrow 
		if (e.keyCode == 38) { 
		   handleUp();
		   return false;
		}
		
		// presenter up / alt
		if (e.keyCode == 18) { 
		   handleUp();
		   return false;
		}
		
		// down arrow
		if (e.keyCode == 40) { 
		   handleDown();
		   return false;
		}
		
		// presenter down / b
		if (e.keyCode == 66) { 
		   handleDown();
		   return false;
		}
		
	});
	

});



