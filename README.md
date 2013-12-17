iFSM
====

A  (yet another) powerful and flexible Finite and Hierarchical State Machine ( FSM / HSM ) for JQuery.


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
        IsDisplayed     : 
        {
            click   :   
            {
                init_function       : function(){this.opts.aDiv.hide()},
                next_state      : 'IsNotDisplayed'
            }
        }, 
        IsNotDisplayed      : 
        {
            click   :   
            {
                init_function       : function(){this.opts.aDiv.show()},
                next_state      : 'IsDisplayed'
            }
        },
        DefaultState        :
        {
            start   :
            {
                next_state  : 'IsDisplayed'
            }
        }
    };
    
    $('#myButton1').iFSM(aStateDefinition);
	
	</script>
</head>
<body style="margin:100px;">
    <button id="myButton">hello</button>
    <div id="adiv">a nice text to show the FSM capabilities :-)</div>
</body>
</html>
```

Examples
========

  - Example_1.html - simple example of independant buttons using the same machine definition
  - Example_2.html - simple example of submachine delegation. It show how to set condition on state change according to submachine states.
  - Example_Request - simple example of a 'request' process with a diagram showing the state changes according to the triggered events 
  - Example_HSM_calculator - not really optimized but a working calculator
  

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
	 			submachine : <a State definition>
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
 			process_on_UItarget: <true|false(default)>
 			process_event_if : <a statement that returns boolean>,
 			propagate_event_on_refused : <anEventName>
 			init_function: <a function(parameters, event, data)>,
 			properties_init_function: <parameters for init_function>,
 			next_state: <aStateName>,
 			next_state_when: <a statement that returns boolean>,
   			next_state_on_target : 
   			{
   				condition 			: <logical_operator : '||' '&&'>
   				submachines			: 
   				{
   					<submachineName1> 	: 
   					{
   						condition	: <'' 'not'>
   						target_list : [<targetState1>,...,<targetStaten>],
  					}
   					...
   					<submachineNamen> 	: ...
  				}
   			}
 			out_function: <a function(parameters, event, data)>,
 			properties_out_function: <parameters for out_function>,
 			next_state_if_error: <aStateName to go if init_function returns false>,
 			propagate_event: <void||anEventName>
 			prevent_bubble: <true|false(default)>
 			UI_event_bubble: <true|false(default)>
		},
		<aEventName....>:
		{
			....
		},
		enterState : ...
		exitState :  ...
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
  - **delegate_machines** : sub machines list to delegate the events on the state
  	- submachine : the variable name of a state definition or a state definition description
  - **eventname** : <br>
  the name of an event. It may be any event name, supported by javascript or not (should be manually triggered).<br>
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
  - **propagate_event** : if defined, the current event is propagated to the next state
  					if it's the name of an event, triggers the event...
  - **prevent_bubble** : if defined and true, the current event will not bubble to its parent machine
  - **UI_event_bubble** : if defined and true, the current event will bubble. By default, no UI event bubbling...
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
