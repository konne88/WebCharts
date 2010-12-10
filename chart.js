/*
* The Chart Library
* Small Javascript Framework for creating charts in the webbrowser
*
* Copyright (C) 25. Jan 2010  Konstantin Weitz
*
* This program is free software; you can redistribute it and/or modify it under
* the terms of the GNU General Public License as published by the Free Software
* Foundation; either version 3 of the License, or (at your option) any later 
* version.
*
* This program is distributed in the hope that it will be useful, but WITHOUT
* ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
* FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with 
* this program; if not, see <http://www.gnu.org/licenses/>.
*/

/* Useful links
* Canvas documentation
* https://developer.mozilla.org/en/Canvas_tutorial
*/

/* The Basic Concept
*  There is a single baseclass called Chart. It implements a standardised interface to add data to a chart, render it,
*  And do some other fancy stuff. See below for more infos.
*  But this class can't render your data  by default. So what you have to do is to actually create an Implementation of this class
*  like PieChart. You can also create a Chart first, pack it with data and settings and pass it to the constructor of 
*  an implementation. The implementation will copy all the data and then you can just render it. This is usefull
*  if you plan to render the same Chart Data with different Implementations.
*/

/* Some Conventions
*  If a function takes the parameters x,y,w,h this means, that it expects the boundaries of a rectangle.
*  x and y represent the top-left corner of this rect and w,h the width and height.
*  
*     y
*   x +------------
*     |            | 
*     |            | h
*     |            | 
*     |            |
*      ------------
*            w
*
*  If a color is mentioned, this means a color string in CSS style.
*  e.g. "red","blue","#ABCDEF","rgb(1,2,3)"
*  Read more about default colors in the Chart description
*  
*  A context represents a 'thing you can draw on'. In most cases this
*  Will be received by a canvas html element. Each Non-Internal function
*  owns a wrapper, that can be called with the id of such a canvas.
*/

/* How To Start
*  Quck start, simple example
* 
* <!DOCTYPE html>
* <html>
* 	<head>
* 		<script type="text/javascript" src="chart.js"></script>
* 		<script type="text/javascript">
* 			if(window.addEventListener){
* 				addEventListener("load", drawCanvas, false);
* 			}
* 
* 			function drawCanvas(){
* 				var chart1 = new PieChart();
* 				chart1.add_bar("A",2);
* 				chart1.add_bar("B",3);
* 				chart1.add_bar("C",4);
* 				chart1.render_canvas('cv1');
* 			}
* 		</script>
* 	</head>
* 	<body>
* 		<canvas id="cv1" width="300" height="300"></canvas>
* 	</body>
* </html> 
*
*  If you want to know more, start by reading the comments about the Chart class
*  And then the documentation for the Implementation of Chart you want to use.
*/

/* Inheritance
*  Well this is JS, which is awesome, but there are many ways to do inheritance.
*  The way it is performed here is one possibility, it is not perfect, but balances
*  Complexity and Written text realtively speedy.
*
*  Consider A to be the base class and B to be the class inheriting from A.
*  
*  In order to inheritance, we need to make sure, that the prototype of B has the prototype of A.
*  If that is the case, then all of the functions (static objects) of A will be accesibly by B.
*  So how do we do that? All objects of the type A have the wanted A prototype. The prototype of B
*  is nothing else then an object. So why not just assign an object of the type A to the prototype of B.
*  
*  Well this is exactly what we do here:
*  B.prototype = new A();
*
*  What are the disandvantages? Well obviously we call a constructor in order to create an object, where
*  we don't really care for the data in the object itsself at all. This is a serious downside
*  of this method. Think about it, we actually have the data of some damn A object with the static functions of 
*  the B class. But oh well it is simple and you don't really see the sideeffekts. 
*
*  So now we know how we get those static functions what about properties. They are created in the constructor,
*  by calling A.call(this).
*/

PieChart.prototype = new Chart();
PieChart.prototype.constructor = PieChart;
/* PieChart
*  Renders a pie chart, using the first value in each searies
*    _____
*   /     \
*  |\_____/|
*   \_____/
*
*  Because it is rather pointless to animation a piechart, it is not supported 
*  for this type of chart yet. Thought it might give a very nice effect to
*  implement something.
*
*  Properties supported
*
*  scale   Defines the perspective of the chart (3D look)
*  height  Defines the height of the chart
*/
function PieChart(chart){
	if(arguments.length == 1){
		chart.clone(this);
	}
	else {
		Chart.call(this);
	}
	
	this.scale = 0.4;
	this.height = 50;
}

/* See Chart */
PieChart.prototype.render = function(context,x,y,w,h){
	if(this.maxFirstValue==0){
		return;
	}
	
	// calculate the middle of the radius
	var val;
	var xc = x+w/2;
	var yc = y+(h-this.height)/2;
	var r = w/2;
	var start = 0;
	
	context.save();
	context.strokeStyle = "black";

	this.handle_blur(context);

	// draw for each first value of a series it's share of the total value
	for(var i=0 ; i<this.series.length ; ++i){
		if(this.series[i].values.length > 0){
			val = this.series[i].values[0]/this.firstValuesTotal*2*Math.PI;
		} else {
			val = 0;
		}

		this.draw_slice(context,xc,yc,r,start,start+val,this.series[i].color);
		start += val;
	}

	context.restore();
};


/* Internal use only
*  Draws a slice of the pie
*  start is the starting angle, end the ending angle
*/
PieChart.prototype.draw_slice = function(context,x,y,r,start,end,color){
	var h = this.height/this.scale;	
	y/=this.scale;

	context.save();
	context.scale(1,this.scale);

	// draw the top lid of the chart
	var radgrad = context.createRadialGradient(x-r,y+r*0.3,r*0.01 , x,y,r*2);  
	radgrad.addColorStop(0, 'white');
	radgrad.addColorStop(1, color);
	context.fillStyle = radgrad;

	context.beginPath();
	context.arc(x,y,r,start,end,false);
	context.lineTo(x,y);
	context.closePath();
	context.fill();
	context.stroke();

	// draw the tube if the start of it is still in the front of the chart and therefore visible
	if(start<=Math.PI){
		// if the end exceeds the visible area, set the new boundary to the very left visible end
		end = Math.min(end,Math.PI);
		
		// draw the frontpart
		var lingrad = context.createLinearGradient(x-1.2*r,y,x+r,y);
		lingrad.addColorStop(0, color); 
		lingrad.addColorStop(0.1, 'white');
		lingrad.addColorStop(0.6, color);  
		context.fillStyle = lingrad;

		context.beginPath();
		context.arc(x,y+h,r,start,end,false);
		context.arc(x,y,r,end,start,true);
		context.closePath();
		context.fill();
		context.stroke();
	}

	context.restore();
};

Graph.prototype = new Chart();
Graph.prototype.constructor = Graph;

/* Graph
*  Renders a Graph, plotting the full data, meaning each searies.
*        
*   |       __/___/
*   |  ____/ /
*   | /_____/_
*   |//    /  \
*   |/____/____\____
*
*  Animation makes the lines being plotted from left to right, not showing the result right away.
*
*  Properties supported
*
*  verticalLines, horizontalLines    The amount of lines in the background grid
*/
function Graph(chart){	
	if(arguments.length == 1){
		chart.clone(this);
	}
	else {
		Chart.call(this);
	}
	
	this.verticalLines = 10;
	this.horizontalLines = 10;
}

/* See Chart */
Graph.prototype.render = function(context,x,y,w,h){
	this.animate(context,x,y,w,h,0);
};

/* See Chart */
Graph.prototype.animate = function(context,x,y,w,h,ms){
	var arrowW = 4;

	context.save();
	context.strokeStyle = "black";
	this.handle_blur(context);

	// avoid division by 0
	ms=Math.max(1,ms);

	var progress = 1000/ms/this.fps;
	var self = this;
	var func = function() {
		context.clearRect(0,0,300,300);

		self.draw_grid(context,x+arrowW,y+arrowW,w-2*arrowW,h-2*arrowW);
		self.plot_values(context,x+arrowW,y+arrowW,w-2*arrowW,h-2*arrowW,progress);
		self.draw_coordinates(context,x,y,w,h,arrowW);

		if(progress<1){
			setTimeout(func, 1000/self.fps);
			progress += 1000/ms/self.fps;
		}
	};

	func();

	context.restore();
};

/* Internal use only
 * Draws the grid behind the graph
 */
Graph.prototype.draw_grid = function(context,x,y,w,h){
	context.save();
	context.lineWidth = 0.5;
	context.strokeStyle = "#CCC";
	var i;
	
	for(i=0 ; i<this.horizontalLines ; ++i){
		context.moveTo(x,y+h*i/this.horizontalLines);
		context.lineTo(x+w,y+h*i/this.horizontalLines);
	}

	for(i=0 ; i<this.verticalLines ; ++i){
		context.moveTo(x+w*(i+1)/this.verticalLines,y);
		context.lineTo(x+w*(i+1)/this.verticalLines,y+w);
	}

	context.stroke();
	context.restore();
};

/* Internal use only
*  draws the coordinates system sourrounding the graph
*/
Graph.prototype.draw_coordinates = function(context,x,y,w,h,arrowW){
	var arrowH = 8;

	context.beginPath();
	context.moveTo(x,y+arrowH);
	context.lineTo(x+arrowW,y);
	context.lineTo(x+2*arrowW,y+arrowH);
	context.moveTo(x+arrowW,y);
	context.lineTo(x+arrowW,y+h-arrowW);
	context.lineTo(x+w,y+h-arrowW);
	context.moveTo(x+w-arrowH,y+h-2*arrowW);
	context.lineTo(x+w,y+h-arrowW);
	context.lineTo(x+w-arrowH,y+h);
	context.stroke();
};

/* Internal use only
*  This function draw the graph of all the data series in the chart.
*  Progress defines how much of the graph (from left 0 to right 1)
*  should be drawn yet.
*/
Graph.prototype.plot_values = function(context,x,y,w,h,progress){
	if(this.maxValue==0 || this.maxLen <= 1){
		return;
	}
	
	var val;

	var pointDist = w/(this.maxLen-1);

	context.save();

	// create the clipping area that helps implementing the progress
        // the lines are actually always drawn the entire way and then cliped
	// maybe not the fastest method but simple       
	context.beginPath();
	context.moveTo(x,y);
	context.lineTo(x,y+h);
	context.lineTo(x+w*progress,y+h);
	context.lineTo(x+w*progress,y);
	context.closePath();
	context.clip();

	// draw the lines
	context.lineWidth = 2;
	context.lineCap = 'round';
	
	for(var i=0 ; i<this.series.length ; ++i){
		context.beginPath();
		context.strokeStyle = this.series[i].color;
		// start in the 0-point
		context.moveTo(x,y+h);

		for(var a=0 ; a<this.series[i].values.length ; ++a){
			val = this.series[i].values[a]/this.maxValue;
			
			
			var ptest = x+pointDist*a;
			var qtest = y+(1.0-val)*h;
			if(isNaN(ptest) || isNaN(qtest)){
				alert(w);
				alert(this.maxLen-1);			

	alert(x);
				alert(pointDist);
				alert(a);				
				alert(ptest);
				alert(qtest);
			}

			context.lineTo(parseFloat(ptest),parseFloat(qtest));
		}

		context.stroke();
	}

	context.restore();
};

BarChart.prototype = new Chart();
BarChart.prototype.constructor = BarChart;

/* BarChart
*  Renders a BarChart, always using the first value of each series. 
*      _   
*     (_)      _
*     | |  _  (_)
*     | |_(_)_| |
*    /|_| |_| |_|\
*   /_____________\
*
*  Animation makes the bars rise, not showing the result right away.
*
*  Properties supported
*
*  barDistance   The space between two bars
*  scale         Defines the angle of the 3D effect
*/
function BarChart(chart){
	if(arguments.length == 1){
		chart.clone(this);
	}
	else {
		Chart.call(this);
	}
	
	this.barDistance = 10;
	this.scale = 0.4;
}

/* See Chart */
BarChart.prototype.render = function(context,x,y,w,h){
	this.animate(context,x,y,w,h,0);
};

/* See Chart */
BarChart.prototype.animate = function(context,x,y,w,h,ms){
	var floorDist = 2;
	var xOff = 10;
	
	// calc the width of each bar and the height of the floor.
	var barW = (w-2*xOff+this.barDistance)/this.series.length-this.barDistance;
	var floorH = barW*this.scale+floorDist*2;

	context.save();
	context.strokeStyle = "black";
	this.handle_blur(context);

	// resize the coordinates in a way that the bars stand correctly on the floor
	x+=xOff;
	w-=2*xOff;
	h-=floorDist+1;

	// avoid division by 0
	ms=Math.max(1,ms);

	// set to one tick already, this way things without animation will be drawn instantly
	var progress = 1000/ms/this.fps;
	var self = this;
	var func = function() {
		var val;

		context.clearRect(0,0,300,300);
		self.draw_floor(context,x-xOff,y+h-floorH+floorDist+1,w+2*xOff,floorH,xOff);

		// draw all the bars that have a value assigned.
		// Only draw up until progress, even if they are acutally higher 
		for(var i=0 ; i<self.series.length ; ++i){
			if(self.series[i].values.length > 0 && self.maxFirstValue!=0){
				val = self.series[i].values[0]/self.maxFirstValue;
				val = Math.min(val,progress);
			} else {
				val = 0;
			}

			self.draw_bar(context,x+(barW+self.barDistance)*i,y,barW,h,val,self.series[i].color);
		}

		// recall with new timeout if appropriate
		if(progress<1){
			setTimeout(func, 1000/self.fps);
			progress += 1000/ms/self.fps;
		}
	};

	func();

	context.restore();
};

/* Internal used only
   Draws the surface, the bars 'stand' on.
*/
BarChart.prototype.draw_floor = function(context,x,y,w,h,xOff){
	context.save();

	context.beginPath();
	context.moveTo(x, y+h);
	context.lineTo(x+w, y+h);
	context.lineTo(x+w-xOff, y);
	context.lineTo(x+xOff, y);
	context.closePath();
	var lingrad = context.createLinearGradient(x-xOff,y,w/2,h);
	lingrad.addColorStop(0, '#DDD'); 
	lingrad.addColorStop(0.1, '#BBB');
	lingrad.addColorStop(0.3, '#CCC');
	lingrad.addColorStop(0.5, '#EEE');
	lingrad.addColorStop(0.6, '#DDD');
	lingrad.addColorStop(1, '#CCC');
	context.fillStyle = lingrad;
	context.fill();
	context.stroke();

	context.restore();
};
/* Internal use only
*  Draws only one bar in the specified box.
*  Size defines (from 0 to 1) how big the bar should be.
*  E.g. 0.5 hould fill the half of the hight with a bar
*/
BarChart.prototype.draw_bar = function(context,x,y,w,h,size,color){
	var r = w/2;
	h=h/this.scale-2*r;
	y=y/this.scale+r;
	var barTop = h-h*size;

	context.save();

	// draw the bar's tube
	var lingrad = context.createLinearGradient(x-r,y,x+r,y);
	lingrad.addColorStop(0.3, color); 
	lingrad.addColorStop(0.43, 'white');
	lingrad.addColorStop(1, color);  
	context.fillStyle = lingrad;
	context.scale(1,this.scale);

	context.beginPath();
	context.moveTo(x,y+barTop);
	context.arc(x+r,y+h,r,Math.PI,2*Math.PI,true);
	context.lineTo(x+w,y+barTop);
	context.fill();
	context.stroke();

	// draw the bar's top lid
	var radgrad = context.createRadialGradient(x+0.1*r,y+barTop+0.2*r,r*0.03 , x+r/3,y+barTop,r*2);  
	radgrad.addColorStop(0, 'white');
	radgrad.addColorStop(1, color);
	context.fillStyle = radgrad;
	
	context.beginPath();
	context.arc(x+r,y+barTop,r,0,2*Math.PI,false);								
	context.fill();
	context.stroke();
	
	context.restore();
};

/* Internal use only */
function Series(desc,color,values){
	this.color = color;
	this.desc = desc;
	this.values = values;
}

/* Chart
*  Base class of all charts. Stores common values, like the data you want to plot and
*  some settings, which are listed below:

*  useBlur   Disable of enable blur effects. Standard is True.
*  fps       Frames Per Second in an animation. Standard is 25.
*
*  Data is internally represented as a list of series, where each series
*  consists of a description, color and a series of values.
*  All of this together creates a table. Adding data can be done using 
*  the add_series function. If you only want to add one value, you can also
*  Use the add_bar function.
*
*  Colors as parameters to functions can often be avoided. In that case,
*  The class picks a color according to the index, from the 
*  colors Array. You can override this array if you feel the need to or
*  just pass colors the same time you add your data. 
*  The color to each series is picked, at the time when the series is added
*  not when the chart is rendered!
*
*/
function Chart(){
	// make sure to add this also to the copy function
	this.maxLen = 0;	// the length of the longest searies in the data
	this.maxValue = 0;	// the maximum in the entire data
	this.maxFirstValue = 0;		// the maximum value of the first field in each series
	this.firstValuesTotal = 0;	// the total amount of the first fields in the series
	this.series = new Array();
	this.useBlur = true;
	this.fps = 25;
}

/* internal */
Chart.prototype.handle_blur = function(context){
	if(this.useBlur){
		context.shadowOffsetX = 1;
		context.shadowOffsetY = 1;
		context.shadowBlur = 4;
		context.shadowColor = '#AAA';
	}
}

/* add a series of data to the chart, color can be omitted */
Chart.prototype.add_series = function(desc,values,color){
	if(arguments.length == 2){
		color = this.colors[this.series.length%this.colors.length];			
	}

	for(var i=0 ; i<values.length ; ++i){
		this.maxValue = Math.max(values[i],this.maxValue);
	}
	
	if(values.length>0){
		this.firstValuesTotal += values[0];
		this.maxFirstValue = Math.max(values[0],this.maxFirstValue);
		this.maxLen = Math.max(values.length,this.maxLen);
	}

	this.series.push(new Series(desc,color,values));
};

/* add a single data value to the chart, color can be omitted */
Chart.prototype.add_bar = function(desc,value,color){
	var a = new Array();
	a.push(value);
	if(arguments.length == 2){
		color = this.colors[this.series.length%this.colors.length];			
	}
	this.add_series(desc,a,color);
};

/* render the chart on a canvas */
Chart.prototype.render_canvas = function(id){
	var d = 3;
	var c = document.getElementById(id);
	this.render(c.getContext('2d'),d,d,c.offsetWidth-2*d,c.offsetHeight-2*d);
};

/* render the chart on a general context */
Chart.prototype.render = function(context,x,y,w,h){
	alert("The chart's render function is virtul. Use an implementation of Chart like BarChar instead.");
};

/* animate the chart on a canvas, it takes it ms Millisecons to finish with the animation. */
Chart.prototype.animate_canvas = function(id,ms){
	var d = 3;
	var c = document.getElementById(id);
	this.animate(c.getContext('2d'),d,d,c.offsetWidth-2*d,c.offsetHeight-2*d,ms);	
};

/* animate the chart on a general context, it takes it ms Millisecons to finish with the animation. */
Chart.prototype.animate = function(context,x,y,w,h,ms){
	alert("The chart's animate function is virtul. Use an implementation of Chart like BarChar instead.");
};

/* Internal use only */
Chart.prototype.clone = function(dest) {
	dest.maxLen = this.maxLen;
	dest.maxValue = this.maxValue;
	dest.maxFirstValue = this.maxFirstValue;
	dest.firstValuesTotal = this.firstValuesTotal;
	dest.series = this.series.slice(0);
	dest.useBlur = this.useBlur;
	dest.fps = this.fps;
};

/* Internal use only*/
Chart.prototype.create_caption_entry = function(desc,color){
	var div = document.createElement('div');
	div.style.clear = 'both';
	div.style.verticalAlign = 'middle';
	
	var icon = document.createElement('div');
	icon.style.backgroundColor = color;
	icon.style.width = '1em';
	icon.style.height = '1em';
	icon.style.cssFloat = 'left';
	icon.style.borderStyle = 'solid';
	icon.style.borderWidth = '1px';
	icon.style.margin = '2px';
	icon.style.marginRight = '4px';
	div.appendChild(icon);
	
	var txt = document.createTextNode(desc);
	div.appendChild(txt);

	return div;
};

/* Create a caption in the dom object referenced by the id. */
Chart.prototype.create_caption = function(id) {
	var div = document.getElementById(id);
	div.style.borderStyle = 'solid';
	div.style.borderWidth = '1px';
	div.style.margin = '3px';
	div.style.padding = '3px';
		
	var entry;

	for(var i=0 ; i<this.series.length ; ++i){
		entry = this.create_caption_entry(this.series[i].desc,this.series[i].color);
		div.appendChild(entry);
	}
};

/* The standard colors, used if nothing else is passed */
Chart.prototype.colors = new Array("#FF1111","blue","yellow","#088A85","#F0F","#FF8000","aqua","lime","#FFF087");

