/*
Author: Anthony Lazzaro
Summary:
A javascript implementation of Daniel Shiffmans Reynold's boid/flockign algorithm
The processing js library has been used to simplify canvas manipulations
http://processing.org/learning/topics/flocking.html
*/

var plib; //processingLibrary reference

function sketchProc(processing){
	'use strict';
	plib = processing;
	var flock = new Flock();	

	//override setup function
	plib.setup = function(){
		plib.size(window.innerWidth, window.innerHeight - document.getElementsByTagName('header')[0].offsetHeight);
		var startGridPadding = plib.width*0.1;
        var rowSpacer = (plib.height - startGridPadding) / 10;;
        var columnSpacer = (plib.width - startGridPadding) / 10;

		for (var i=0; i < 10; i+=1){
			for(var j=0; j < 10; j+=1){
	            flock.addBoid( new Boid(startGridPadding+i*columnSpacer,startGridPadding+j*rowSpacer));							
			}
		}

	};	

	//override draw function  
	plib.draw = function(){
		plib.size(window.innerWidth, window.innerHeight - document.getElementsByTagName('header')[0].offsetHeight ); 
		plib.background(255);
		flock.run();
	};

	plib.mousePressed = function(){
		flock.addBoid(new Boid(plib.mouseX,plib.mouseY));
	}
}

/*class to represent a boid*/
function Boid(x,y){
	
	this.acceleration = new plib.PVector(0,0);
	this.velocity = new plib.PVector(Math.random() < 0.5 ? -1 * Math.random() : Math.random(),Math.random() < 0.5 ? -1 * Math.random() : Math.random());
	this.location = new plib.PVector(x,y);
	this.r = 2.0;
	this.maxspeed = 2;
	this.maxforce = 0.03;
	
}

Boid.prototype.run = function(boids){
	this.flock(boids);
	this.update();
	this.borders();
	this.render();
};

Boid.prototype.update = function(){
	this.velocity.add(this.acceleration);
	this.velocity.limit(this.maxspeed);
	this.location.add(this.velocity);
	this.acceleration.mult(0);
};

Boid.prototype.borders = function(){
	
	if( this.location.x < this.r) this.location.x = plib.width + this.r;
	if (this.location.y < -this.r) this.location.y = plib.height+this.r;
    if (this.location.x > plib.width+this.r) this.location.x = -this.r;
    if (this.location.y > plib.height+this.r) this.location.y = -this.r;
};

Boid.prototype.render = function(){
    // Draw a triangle rotated in the direction of velocity
    var theta = this.velocity.heading2D() + plib.radians(90);
    plib.fill(200,100);
    plib.stroke(1);
    plib.pushMatrix();
    plib.translate(this.location.x,this.location.y);
    plib.rotate(theta);
    plib.beginShape(plib.TRIANGLES);
    plib.vertex(0, -this.r*2);
    plib.vertex(-this.r, this.r*2);
    plib.vertex(this.r, this.r*2);
    plib.endShape();
    plib.popMatrix();
};

/*
    Three rules create the flocking behaviour
    1.seperation
    2.alignment
    3.cohesion

    These 3 forces/rules are weighted then applied to each boid
*/
Boid.prototype.flock = function(boids){
    sep = this.separate(boids);
    ali = this.alignment(boids);
    coh = this.cohesion(boids);

    sep.mult(3);
    ali.mult(1.0);
    coh.mult(1.0);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
};

/*
    One of the three rules that create the flocking behaviour
	'Cohesion' forces boids to fly towards their neighbors
*/
Boid.prototype.cohesion = function(boids){
    var neighbordist = 50;
    var sum = new plib.PVector(0,0); //empty vector to accumulate locations
    var count = 0;
    
    
    for (var i = 0; i < boids.length; i+=1){
    	
    	var d = plib.PVector.dist(this.location,boids[i].location);
    	if ( (d>0) && (d < neighbordist) ){
    		sum.add(boids[i].location);
    		count += 1;
    	}
    }

    if(count > 0){
    	sum.div(count);
    	return this.seek(sum); //steer this boid towards neighbors
    } else {
    	return new plib.PVector(0,0);
    }

};

/*
    One of the three rules that create the flocking behaviour
	'Alignment' encourages each boid to travel along the average velocity of their neighbors
*/
Boid.prototype.alignment = function(boids){
	var neighbordist = 50;
	var sum = new plib.PVector(0,0);
	var count = 0;
    var i;
    for (i= 0; i < boids.length; i+=1){
    	var d = plib.PVector.dist(this.location,boids[i].location);
    	if ( (d>0) && (d < neighbordist) ){
    		sum.add(boids[i].velocity);
    		count += 1;
    	}
    }

    if (count > 0){
    	sum.div(count);
    	sum.normalize();
    	sum.mult(this.maxspeed);
    	var steer = new plib.PVector.sub(sum, this.velocity);
    	steer.limit(this.maxforce);
    	return steer;
    } else {
    	return new plib.PVector(0,0);
    }

};

/*
    One of the three rules that create the flocking behaviour
	'Separation' makes boids avoid their neighbors
*/
Boid.prototype.separate = function(boids){
	var desiredseparation = 25.0;
	var steer = new plib.PVector(0,0,0);
	var count = 0;
	var i = 0;
	for (i; i< boids.length; i+=1){
		var d = plib.PVector.dist(this.location,boids[i].location);
        if ( (d>0) && (d<desiredseparation) ){
            //calculate vector pointing away from my neighbors
            diff = plib.PVector.sub(this.location,boids[i].location);
            diff.normalize();
            diff.div(d);
            steer.add(diff);
            count += 1;
        }
	}
	
	if (count > 0){
		steer.div(count);
	}

    if (steer.mag() > 0){
    	steer.normalize();
    	steer.mult(this.maxspeed);
    	steer.sub(this.velocity);
    	steer.limit(this.maxforce);
    }
    return steer;
};

/*
Helper function
Calculates and applies steering force towards target
*/
Boid.prototype.seek = function(target){
    var desired = plib.PVector.sub(target,this.location);
    desired.normalize();
    desired.mult(this.maxspeed);
    var steer = plib.PVector.sub(desired,this.velocity);
    steer.limit(this.maxforce);
    return steer;
};

/*
Helper function
updates a boid's acceleration with a force
*/
Boid.prototype.applyForce = function(force){
    this.acceleration.add(force);
};

/*class to represent a flock of boids*/
function Flock () {
    "use strict";
    this.boids = [];
}

Flock.prototype.run = function () {
    "use strict";
    var i;
    for (i = 0; i < this.boids.length; i += 1) {
        this.boids[i].run(this.boids);
    }
};

Flock.prototype.addBoid = function (boid) {
    "use strict";
    this.boids.push(boid);
};



var canvas = document.getElementById("magic");
	
var processingInstance = new Processing(canvas,sketchProc);

