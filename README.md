iFSM
====

a powerful Finite State Machine (FSM) for javascript and JQuery, by Emmanuel Podvin (emmanuel.podvin@intersel.fr) from Intersel (http://www.intersel.fr).

How to use it :
===============
```html
<!DOCTYPE html>
<html>
<head>
	<title>iFSM in action! a Finite State Machine for jQuery</title>
	<script type="text/javascript" src="jquery-1.10.2.min.js"></script>
	<script type="text/javascript" src="jquery.dotimeout.js"></script>
	<script type="text/javascript" src="jquery.attrchange.js"></script>
	<script type="text/javascript" src="ifsm.js"></script>
	
	<script type="text/javascript">
	var aStateDefinition = {
		IsDisplayed		: 
		{
			click	:	
			{
				init_function		: function(){this.opts.aDiv.hide()},
				next_state		: 'IsNotDisplayed'
			}
		}, 
		IsNotDisplayed		: 
		{
			displayButton	:	
			{
				init_function		: function(){this.opts.aDiv.show()},
				next_state		: 'IsDisplayed'
			}
		}
		DefaultState		:
		{
			start	:
			{
				next_state	: 'IsDisplayed'
			}
		}
	}
	myFsm1 = new fsm_manager($('#myButton', aStateDefinition,{aDiv:$('#adiv')}); //we create the FSM object
	myFsm1->InitManager(); //then we init it 
	</script>
</head>
<body style="margin:100px;">
	<button id="myButton">hello</button>
	<div id="adiv">a nice text to show the FSM capabilities :-)</div>
</body>
</html>
```



fsm_manager - class constructor
===============================

```javascript
aStateDefinition //states definition object

{ 
	<aStateName1> :
	{
		<aEventName1>:
		{
			how_process_event: <immediate||push||{delay:<adelay>,preventcancel:<false(default)|true>}>,
			process_event_if : <a statement that returns boolean>,
			propagate_event_on_refused : <anEventName>
			init_function: <a function(parameters, event, data)>,
			properties_init_function: <parameters for init_function>,
			next_state: <aStateName>,
			next_state_when: <a statement that returns boolean>,
			out_function: <a function(parameters, event, data)>,
			properties_out_function: <parameters for out_function>,
			next_state_if_error: <aStateName to go if init_function returns false>,
			propagate_event: <void||anEventName>
		},
		<aEventName....>:
		{
			....
		},
		'enterState' : ...
		'exitState' :  ...
	},
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
  - **eventname** : <br>
  the name of an event. may be any event name supported by JQuery.<br>
  define an event we want to be alerted when it occurs on the object<br>
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
  - **next_state_when** : <br>
  	Definition of condition test that will be evaluated, and if result is true then state will change<br>
  	Following variables may be used for the test:<br>
  	* EventIteration : variable that gives the iteration of the number of calls of the current event. <br>
  	* EventIteration is reset when the state changes<br>
  	* this	: the FSM object<br>
  - **out_function**	 : function name to do once next_state changed
  - **properties_out_function** : parameters to send to out_function
  - **next_state_if_error** (default: does not change state) : state set if init_function return false
  - **propagate_event** : if defined, the current event is propagated to the next state
  					if it's the name of an event, triggers the event...
  
Remarks
========
  - state function should return a boulean : true: ok works fine; false: error
  - state function should have the following input :
  	- parameters : the properties_<init/out>_function
  	- event : the event 
  	- data : the data sent with the event
  - event trigger should be sent at the end of the state function with a return just behind...
  - state function should have one argument : data
  - a default statename 'DefaultState' can be defined to define the default behaviour of some events... 
  - an event is first search in the current state, then if not found in the 'DefaultState'
  - if an event is not found, nothing is done...
  - it will be applied if there is no event definition in the current state
  - a 'start' event is triggered when the FSM is started with InitManager
  
The public available variables
==============================
 - myFSM.currentState : current state name
 - myFSM.myUIObject : the jQuery object associated to the FSM
 - myFSM._stateDefinition : the definition of the states and events
 - myFSM._stateDefinition.<statename>.<eventname>.EventIteration - the number of times an event has been called
 - myFSM.opts - the defined options
 
Within the call of FSM function, you can refer to the FSM by 'this' :
 - this.currentState
 - this.myUIObject
 - this._stateDefinition
 - this.opts
 - this.EventIteration : the current event iteration
 
