iFSM
====

A flexible Finite and Hierarchical State Machine ( FSM / HSM ) designed on JQuery.

It has Push/Pop state capabilities and offers different useful features as :
  * complete integration with jQuery
  * automatic javascript event bindings
  * attribute or css change on jQuery object linked to a machine detected, triggering events to the machine
  * conditional processing of events allowing defining rules
  * conditional state change according to submachines states, allowing to describe promises
  * delayed and asynchronous event processing
  * capability to create or change dynamically states and events on the machines
  * ...
  

Official website
================
http://www.intersel.fr/ifsm-jquery-plugin-demos.html


How to use it :
===============
```html
<!DOCTYPE html>
<html>
<head>
    <title>iFSM in action! a Finite State Machine for jQuery</title>
	<script type="text/javascript" src="extlib/jquery-1.10.2.min.js"></script>
	<script type="text/javascript" src="extlib/jquery.dotimeout.js"></script>
	<script type="text/javascript" src="extlib/jquery.attrchange.js"></script>
	<script type="text/javascript" src="iFSM.js"></script>

    <script type="text/javascript">
    	var aStateDefinition = {
		FirstState     : 
		{
		     enterState:
		    {
		        init_function: function(){alert("First State");}
		    },
		    click:   
		    {
		        next_state: 'NextState'
		    }
		}, 
		NextState      : 
		{
		    enterState:   
		    {
		        init_function: function(){alert("Next State");}
		    },
		    click:   
		    {
		        next_state: 'FirstState'
		    }
		},
		DefaultState        :
		{
		    start   :
		    {
		        next_state  : 'FirstState'
		    }
		}
	};
	$(document).ready(function() {
		$('#myButton').iFSM(aStateDefinition);
	});

    </script>
</head>
<body style="margin:100px;">
    <button id="myButton">Click Me</button>
</body>
</html>
```
Examples
========
See them live : http://www.intersel.fr/ifsm-jquery-plugin-demos.html#demolist

  - [Example_Basic.html](http://www.intersel.fr/assets/gitdemos/iFSM/Example_Basic.html) - the above example in action
  - [Example_1.html](http://www.intersel.fr/assets/gitdemos/iFSM/Example_1.html) - simple example of independent buttons using the same machine definition
  - [Example_2.html](http://www.intersel.fr/assets/gitdemos/iFSM/Example_2.html) - simple example of sub-machine delegation. It shows how to set conditions on state change according to submachine states.
  - [Example_PushPopState.html](http://www.intersel.fr/assets/gitdemos/iFSM/Example_PushPopState.html) - simple example of using the "Push/Pop" capabilities on states.
  - [Example_AnalyseString.html](http://www.intersel.fr/assets/gitdemos/iFSM/Example_AnalyseString.html)  - show analysis on string input analysis with palindrome, showing that iFSM is more than a simple FSM using a Push/Pop states Stack-Based. 
  - [Example_Rulers](http://www.intersel.fr/assets/gitdemos/iFSM/Example_Rulers.html) - showing how to use iFSM to validate input data according to rules, with an example of the management of the keyboard input filtering only number input
  - [Example_Request](http://www.intersel.fr/assets/gitdemos/iFSM/Example_Request.html) - simple example of a 'request' process with a diagram showing the state changes according to the triggered events 
  - [Example_HSM_calculator](http://www.intersel.fr/assets/gitdemos/iFSM/Example_HSM_calculator.html) - a simple working calculator managed with states and events...
  - The [Mastermind game](http://www.intersel.fr/assets/gitdemos/iFSM/Mastermind.html)...
  - A [Bouncing ball](http://www.intersel.fr/assets/gitdemos/iFSM/Example_BouncingBall.html) using canvas (with jcanvas) showing a game loop example...

.iFSM(aStateDefinition, [options])
==================================
Create a Finite State Machine from the "aStateDefinition" object to bind with the jQuery object.

  * aStateDefinition: object, defines the different states and bound events. See "Machine State Definition" chapter.
  * options: object, defines the options of the FSM :
    * startEvent: name of the starting event (default: 'start')
    * initState: name of the state to set at start of the machine
    * debug (true|false): show debug message on the console (default true)
    * LogLevel
      * '1' only errors displayed 
      * '2' - errors and warnings (default)
      * '3' - all  
    * logFSM:  list of FSM names to follow on debug (ex: "FSM_1 FSM_4"). If void, then displays all machine messages
    * <myProperties> : any properties that could be used and accessed by the machine with this.opts as this.opts.<myProperties>

  Call Examples
  =============
  
```html
  <button id="myButton">Button</button>
  <script>
  	aFSMDefinition = {
  		aState:{
  			click:{
  				init_function:function(){
  					alert(this.opts.inputFunction(this.opts.inputData));
  				}
  			}
  		}
  	};
	$('#myButton').iFSM(aFSMDefinition,{
		 initState:'aState'
		,inputData:'Hello World :-)'
		,inputFunction:function(aText){return aText;}
		,LogLevel:1
		});  
  </script>
```

.getFSM([aStateDefinition])
===========================
Get the FSM bound to the jQuery object.

  * aStateDefinition: object, a state definition used to define a FSM. it Allows to find a specific FSM if several are defined on the same jQuery object.

  Call Examples
  =============
  
```html
  <script>
  myFSM = $('#myButton').getFSM(); //get the linked FSM objects
  </script>
```



Machine State Definition
========================

The states are defined with a javascript object with the following organization:

```javascript
var aStateDefinition =
{ 
 <aStateName1> :
 {
 	delegate_machines	: 
 	{
 		<aSubMachine name 1> : 
 		{
 			submachine : <a State definition>,
 			no_reinitialisation : <boolean, default:false>
 		},			
 		<aSubMachine name i> : 
 		{
 			submachine : <a State definition>
 		},			
 		...
 	},	  		
 	<aEventName1>:
 	{
		how_process_event: <immediate||push (default)||{delay:<adelay>,preventcancel:<false(default)|true>}>,
		init_function: <a function(parameters, event, data)>,
 		properties_init_function: <parameters for init_function>,
 		next_state: <aStateName>,
 		pushpop_state: <'PushState'||'PopState'>,
 		next_state_when: <a statement that returns boolean>,
 		next_state_on_target : 
 		{
 			condition 			: <'||'||'&&'>
 			submachines			: 
 			{
 				<submachineName1> 	: 
 				{
 					condition	: <''(default)||'not'>
					target_list : [<targetState1>,...,<targetStaten>],
 				}
 				...
 				<submachineNamen> 	: ...
	 		}
 		}
 		next_state_if_error: <aStateName>,
 		pushpop_state_if_error: <'PushState'||'PopState'>,
 		propagate_event: <true||anEventName||[anEventName1,anEventName2,...]>
 		process_event_if : <a statement that returns boolean>,
 		propagate_event_on_refused : <anEventName>
 		out_function: <a function(parameters, event, data)>,
 		properties_out_function: <parameters for out_function>,
 		prevent_bubble: <true|false(default)>
 		process_on_UItarget: <true|false(default)>
 		UI_event_bubble: <true|false(default)>
 	},
 	<aEventName....>: <anOtherEventName>,
 	<aEventName....>:
 	{
 		....
 	},
 	enterState : ...
 	exitState :  ...
 },
 <aStateName...> : <anAnotherStateName>,
 <aStateName...> :
 {
 	....
 },
 DefaultState :
 {
 	start: //a default start event received at the FSM start
 	{
 	},
 	<aEventName....>:
 	{
 	}
 }
}
```

- **statename** :
  - **delegate_machines** : sub machines list to delegate the events on the state
  	- submachine : the variable name of a state definition or a state definition description
  - **eventname** : <br>
  the name of an event. It may be any event name, supported by javascript or manually triggered.<br>
  It defines an event we want to be alerted when it occurs on the object<br>
	specific events :<br>
	- 'start' : this event is automatically sent when the FSM starts. should be defined in the initial state (or 'DefaultState')
	- 'enterState' : this event is automatically sent and immediatly executed when the FSM enter the state
	- 'exitState' : this event is automatically sent and immediatly executed when the FSM exit the state
	- 'attrchange' : received if any attribute of the jquery object (myUIObject) changed
		- data sent : event - event object
			* event.attributeName - Name of the attribute modified
			* event.oldValue      - Previous value of the modified attribute
			* event.newValue      - New value of the modified attribute
	- 'attrchange_<attributename>' (ex: 'attrchange_class') : received if the attribute of the jquery object changed
		- data sent :
			* newValue      - New value of the modified attribute
			* oldValue      - Previous value of the modified attribute
	- 'attrchange_style_<cssattributename_in_camelcase>' (ex:'attrchange_style_width') : received if the css attribute of the jquery object changed
		- data sent :
		    * newValue      - New value of the modified attribute
		    * oldValue      - Previous value of the modified attribute
  An event can be the synonymous to an other event. Then give the name of the synomymous event instead of its definition.
  - **how_process_event** [default:{push}] : {immediate}||{push}||{delay:delay_value,preventcancel:<false(default)|true>}
  	if delay is defined, the processing of the event is delayed and activated at 'delay'
  	by default, any event delayed will be cancelled if the state changes
  	if preventcancel is defined, the delayed event won't be cancelled
  - **process_event_if** :
  	Definition of condition test that will be evaluated, and if result is true then event will be processed
  	if not, see if a propagate_event_on_refused to trigger it... and do nothing more...
  - **propagate_event_on_refused** : an event name to trigger if process_event_if is false
  - **init_function**  : function name
  - **properties_init_function** : parameters to send to init_function
  - **next_state** : next state once init_function done
  - **pushpop_state** : <br> 
	If 'PushState', then current state is pushed in the StateStack then next_state takes place. If set in an event defined in 'DefaultState', the system will get the actual state.
	If 'PopState', then the next state will be the one on top of the StateStack which is poped. next_state is so overwritten... If the stack is void, there is no state change. 
  - **next_state_when** : <br>
	Definition of condition test that will be evaluated, and if result is true then state will change
	Following variables may be used for the test
	- this	: the FSM object
	- this.EventIteration : variable that gives the iteration of the number of calls of the current event. 
	EventIteration is reset when the state changes
  - **next_state_on_target** :<br>
	Definition of condition test based on the current states of the defined submachines
	The test consist to :
	- get the current states of each defined sub-machines, 
	- match the current state to the targeted state array, resulting to true if found 
	- apply the defined operator between the results
	- if the result is positive, then the next state processing is done
  - **out_function**	 : function name to do once next_state changed
  - **properties_out_function** : parameters to send to out_function
  - **next_state_if_error** (default: does not change state) : state set if init_function return false
  - **pushpop_state_if_error** : 
	If 'PushState', then current state is pushed in the StateStack then next_state_if_error takes place.
	If 'PopState', then the next state will be the one on top of the StateStack which is poped. next_state_if_error is so overwritten... If the stack is void, there is no state change. 
  - **propagate_event** : if defined to true, the current event is propagated to the next state
  				if it's the name of an event, the event is triggered
				if it's an array of events, events are triggered in sequence
  - **prevent_bubble** : for submachines use, if defined and true, the current event will not bubble to its parent machine. By default, events bubble from submachines to their parent
  - **UI_event_bubble** : for graphic events use, if defined and true, the current event will bubble. By default, no UI event bubbling...
  - **process_on_UItarget** : if defined and true, the current event will be processed only if the event was directly targeting 
   									the UI jQuery object linked to the machine

Remarks
========
  - state function should return a boolean : true: ok works fine; false: error
  - state function should have the following input :
  	- parameters : the properties_<init/out>_function
  	- event : the event 
  	- data : the data sent with the event
  - a default statename 'DefaultState' can be defined to define the default behaviour of some events... 
  - an event is first search in the current state, then if not found in the 'DefaultState'
  - when an event is not found, nothing is done...
  - it is possible to trigger any event to a machine with the jquery trigger function :
  		ex: $('#myButton1').trigger('aEventName');
  - in a state/event function, you can trigger event to the current machine :
    	ex : this.trigger('aEventName')
  - if a delayed event is sent again before a previous one was processed, the previous event is cancelled and the new one re-started
  - a 'start' event is always triggered when the FSM is started with InitManager
  - when the machine starts and sets the 'options.initState' to be the initial state, 'enterState' is not triggered. This event may be triggered manually when 'start' event is received (see 'propagate_event')

Event Processing
================

The "how_process_event" allows to define how the event should be processed by the machine.

By default, when a machine receives an event and is still processing one, it will push it in its next event list to be processed... and gives back the hand...

This way, any function that triggers an event will have immediatly the hand back. It prevents any uncontrolled effects that could arrive with the normal trigger mecanisms that immediatly processes event and all the function calls and then gives back the hand to the caller.

Of course, if you want to have the event immediatly processed, you can ask it with the "immediate" option.
Or on the contrary, to have the event processed after a delay with the "delay:delay_value" option.

Delayed Events
==============

By default, any delayed event will be cancelled if the state of the machine change, as it is considered that the event has its context changed... It is possible to keep it even though the state changed with the preventcancel option.


SubMachine
==========
  - when there are sub machines defined for a state :
	- the events are sent to each defined submachines in the order
	- once the event is processed by the submachines, it is bubbled to the upper machines
	- it is possible to prevent the bubbling of events with the directive 'prevent_bubble' to true
	- a submachine works as the main one : 
		- if no_reinitialisation == false (default), it is initialized each time we enter the main state
		- a start event is triggered to it (if initialized)
		- once initialized, the submachine is ready to listen to the triggered events
  - a sub machine can manage its first state by handling the 'start' event in the DefaultState

The public available variables
==============================
 - myFSM.currentState : current state name
 - myFSM.myUIObject : the jQuery object associated to the FSM
 - myFSM._stateDefinition : the definition of the states and events
 - myFSM._stateDefinition.<statename>.<eventname>.EventIteration - the number of times an event has been called
 - myFSM.opts - the defined options
 - myFSM.rootMachine : the root machine
 - myFSM.parentMachine : the parent machine if we're in a sub machine (null if none)
 
Within the call of FSM function, you can refer to the FSM by 'this' :
 - this.currentState
 - this.myUIObject
 - this._stateDefinition
 - this.opts
 - this.EventIteration : the current event iteration
 
Contact
=======
If you have any ideas, feedback, requests or bug reports, you can reach me at github@intersel.org, 
or via my website: http://www.intersel.fr
