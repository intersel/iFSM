/**
 * -----------------------------------------------------------------------------------------
 * INTERSEL - 4 cité d'Hauteville - 75010 PARIS
 * RCS PARIS 488 379 660 - NAF 721Z
 *
 * File : ifsm.js
 * Abstract : a simple finite state machine
 * -----------------------------------------------------------------------------------------
 * Modifications :
 * - 2013/10/23 - E.Podvin - V1.0 - Creation
 * - 2013/11/03 - E.Podvin - V1.1 - add
 * - 2013/11/04 - E.Podvin - V1.2 - add process_event_if condition  
 * - 2013/11/05 - E.Podvin - V1.3 - add sub machine to manage hierarchical state machines (HSM)
 * -----------------------------------------------------------------------------------------
 * @copyright : Intersel 2013
 * @author : Emmanuel Podvin - emmanuel.podvin@intersel.fr
 * @version : 1.3
 * -----------------------------------------------------------------------------------------
 */

/**
 * How to use it :
 * ===============
 * <code>
 * <script type="text/javascript" src="jquery-1.10.2.min.js"></script>
 * <script type="text/javascript" src="jquery.dotimeout.js"></script>
 * <script type="text/javascript" src="jquery.attrchange.js"></script>
 * <script type="text/javascript" src="ifsm.js"></script>
 * //Example of use :
 * <script type="text/javascript">
 *	var aStateDefinition = {
 *
 * 			IsDisplayed			: 
 *				{
 *					click	:	
 * 						{
 *							init_function 				: DisplayMe,
 *							properties_init_function 	: {display:false} 
 *							next_state				: 'IsNotDisplayed'
 *						}
 *				}, 
 *			IsNotDisplayed		: 
 *				{
 *					displayButton	:	
 * 						{
 *							init_function 				: DisplayMe, 
 *							properties_init_function 	: {display:true} 
 *							next_state				: 'IsDisplayed'
 *						}
 *				}
 * }
 * myFsm1 = new fsm_manager($('#myButton1', aStateDefinition); //we create the FSM object
 * myFsm1->InitManager(); //then we init it 
 * </script>
 * </code>
 *
 */

/**
 * 
 * fsm_manager - class constructor
 * @param aStateDefinition - states definition object
 * { 
 * 	<aStateName1> :
 * 	{
 * 		delegate_machines	: 
 * 		{
 * 			<aSubMachine name 1> : 
 * 			{
 * 				submachine : <a State definition>
 * 			},			
 * 			<aSubMachine name i> : 
 * 			{
 * 				submachine : <a State definition>
 * 			},			
 * 			...
 * 		},	 
 *  		
 * 		<aEventName1>:
 * 		{
 * 			how_process_event: <immediate||push (default)||{delay:<adelay>,preventcancel:<false(default)|true>}>,
 * 			process_on_UItarget: <true|false(default)>
 * 			process_event_if : <a statement that returns boolean>,
 * 			propagate_event_on_refused : <anEventName>
 * 			init_function: <a function(parameters, event, data)>,
 * 			properties_init_function: <parameters for init_function>,
 * 			next_state: <aStateName>,
 * 			next_state_when: <a statement that returns boolean>,
 * 			out_function: <a function(parameters, event, data)>,
 * 			properties_out_function: <parameters for out_function>,
 * 			next_state_if_error: <aStateName to go if init_function returns false>,
 * 			propagate_event: <void||anEventName>
 * 			prevent_bubble: <true|false(default)>
 * 			UI_event_bubble: <true|false(default)>
 * 		},
 * 		<aEventName....>:
 * 		{
 * 			....
 * 		},
 * 		enterState : ...
 * 		exitState :  ...
 * 	},
 * 	<aStateName...> :
 * 	{
 * 		....
 * 	},
 *  DefaultState :
 * 	{
 * 		start: //a default start event received at the FSM start
 * 		{
 * 		},
 * 		<aEventName....>:
 * 		{
 * 		}
 * 	}
 * }
 * 
 *   - statename :
 *   	- delegate_machines : sub machines list to delegate the events on the state
 *   		- submachine : the variable name of a state definition or a state definition description
 *   	- eventname : 
 *   			the name of an event. may be any event name supported by JQuery.
 *   			define an event we want to be alerted when it occurs on the object
 *   			specific events :
 *   				- 'start' : this event is automatically sent when the FSM starts. should be defined in the initial state (or 'DefaultState')
 *   				- 'enterState' : this event is automatically sent and immediatly executed when the FSM enter the state
 *   				- 'exitState' : this event is automatically sent and immediatly executed when the FSM exit the state
 *   				- 'attrchange' : received if any attribute of the jquery object (myUIObject) changed
 *   					- data sent : event - event object
 *   									* event.attributeName - Name of the attribute modified
 *   									* event.oldValue      - Previous value of the modified attribute
 *   									* event.newValue      - New value of the modified attribute
 *   				- 'attrchange_<attributename>' (ex: 'attrchange_class') : received if the attribute of the jquery object changed
 *   					- data sent :
 *   						* newValue      - New value of the modified attribute
 *   						* oldValue      - Previous value of the modified attribute
 *   				- 'attrchange_style_<cssattributename_in_camelcase>' (ex:'attrchange_style_width') : received if the css attribute of the jquery object changed
 *   					- data sent :
 *   						* newValue      - New value of the modified attribute
 *   						* oldValue      - Previous value of the modified attribute
 *   		- how_process_event [default:{push}] : {immediate}||{push}||{delay:delay_value,preventcancel:<false(default)|true>}
 *   			if delay is defined, the processing of the event is delayed and activated at 'delay'
 *   			by default, any event delayed will be cancelled if the state changes
 *   			if preventcancel is defined, the delayed event won't be cancelled
 * 			- process_event_if :
 *   			Definition of condition test that will be evaluated, and if result is true then event will be processed
 *   			if not, see if a propagate_event_on_refused to trigger it... and do nothing more...
 * 			- propagate_event_on_refused : an event name to trigger if process_event_if is false
 *   		- init_function  : function name or a function statement
 *   		- properties_init_function : parameters to send to init_function
 *   		- next_state : next state once init_function done
 *   		- next_state_when : 
 *   			Definition of condition test that will be evaluated, and if result is true then state will change
 *   			Following variables may be used for the test
 *   			this	: the FSM object
 *   			this.EventIteration : variable that gives the iteration of the number of calls of the current event. 
 *   							 EventIteration is reset when the state changes
 *   		- out_function	 : function name to do once next_state changed
 *   		- properties_out_function : parameters to send to out_function
 *   		- next_state_if_error (default: does not change state) : state set if init_function return false
 *   		- propagate_event : if defined, the current event is propagated to the next state
 *   							if it's the name of an event, triggers the event...
 *   		- prevent_bubble : if defined and true, the current event will not bubble to its parent machine
 *   		- UI_event_bubble : if defined and true, the current event will bubble. By default, no UI event bubbling...
 *   		- process_on_UItarget : if defined and true, the current event will be processed only if the event was directly targeting 
 *   									the UI jQuery object linked to the machine
 *   
 * @remarks
 * - any FSM is automatically initialised with a 'start' event
 * - state function should return a boolean : true: ok works fine; false: error
 * - state function should have the following input :
 * 		- parameters : the properties_<init/out>_function
 * 		- event : the event
 * 		- data : the data sent with the event
 * - a default statename 'DefaultState' can be defined to define the default behaviour of some events...
 * - an event is first search in the current state, then if not found in the 'DefaultState'
 * - if an event is not found, nothing is done...
 * - a 'start' event is triggered when the FSM is started with InitManager
 * - when there are sub machines defined for a state :
 * 		- the events are sent to each defined submachines in the order
 * 		- once the event is processed by the submachines, it is bubbled to the upper machines
 * 		- it is possible to prevent the bubbling of events with the directive 'prevent_bubble' to true
 * 		- a submachine works as the main one : it is initialised then started once entering in the state and a start event is sent to it
 *   
 * - it is possible to trigger any event to a machine with the jquery trigger function :
 * 		ex: $('#myButton1').trigger('start',{targetFSM:myFsm});
 * - within a state function, it is possible to trigger event to any machine using its linked jQuery object : myFSM.myUIObject
 *   	ex : this.myUIObject.trigger('aEventName')
 * - if multiple machine are assigned to the same jQuery Object, it also possible to specify the FSM in the parameter :
 *   	ex : this.myUIObject.trigger('aEventName',{targetFSM:this})
 * 
 * 
 * The public available variables :
 * 	- myFSM.currentState : current state name
 *  - myFSM.myUIObject : the jQuery object associated to the FSM
 *  - myFSM._stateDefinition : the definition of the states and events
 *  - myFSM._stateDefinition.<statename>.<eventname>.EventIteration - the number of times an event has been called
 *  - myFSM.opts - the defined options. Generally used to store local data
 *  - myFSM.rootMachine : the root machine
 *  - myFSM.parentMachine : the parent machine if it's in a sub machine (null if none)
 *  
 *  Within the call of FSM function, you can refer to the FSM by 'this', examples :
 *  - this.currentState
 *  - this.myUIObject
 *  - ...
 *  plus about event:
 *  - this.EventIteration : the current event iteration
 *  - this.actualTarget : the jQuery object that is currently targetted by an event
 *  
 * @param anObject - a jquery object on which the FSM applies. 
 * 						should have the property 'id' defined
 * @param options - an object defining the options:
 * 	- boolean debug
 *  - integer LogLevel -
 *  	- 1 only errors displayed
 *  	- 2 - errors and warnings
 *  	- 3 - all 
 *  - boolean AlertError - send an alert box when error  
 *  - boolean startEvent - name of the starting event
 *  - integer maxPushEvent - size of the push events array
 */


/*
 * @param integer nb_FSM - number of active FSM
 */
var nb_FSM = 0;
	
var fsm_manager =  function (anObject, aStateDefinition, options)
{
	var $defaults = {
			debug				: true,
			LogLevel			: 2,
			AlertError			: false,
			maxPushEvent		: 10,
			startEvent			: 'start',
			prefixFsmName		: 'FSM_',
		}
		
	nb_FSM = nb_FSM+1;
	
	// on charge les options pass�es en param�tre
	if (options == undefined) options=null;
	this.opts = jQuery.extend( {}, $defaults, options || {});
	
	/*
	 * @param string FSMName - name of the FSM
	 */
	this.FSMName = this.opts.prefixFsmName+nb_FSM;
	
	/*
	 * @param Object _stateDefinition - the definition of the states of the FSM 
	 */
	this._stateDefinition = aStateDefinition;
	
	/*
	 * currentState - current state of the fsm
	 * 
	 */
    this.currentState = '';
    
	/*
	 * processEventStatus	- status of the process event execution 
	 * 		- idle : not working
	 * 		- processing : is processing an event
	 * 
	 */
	this.processEventStatus	= 'idle';

	/*
	 * pushEventList array	- an event list waiting to be processed
	 * 
	 */
	this.pushEventList	= new Array();
	
	/*
	 * myUIObject		- Target object of the FSM
	 */
	this.myUIObject	= anObject;

	/*
	 * @param listEvents - array of the events subscribed
	 */
	this.listEvents	={};

	/*
	 * @param rootMachine - root FSM machine of this current FSM
	 */
	if (this.opts.rootMachine == undefined) this.opts.rootMachine = this;
	this.rootMachine = this.opts.rootMachine;
	
	/*
	 * @param parentMachine - parent machine of this current one
	 */
	if (this.opts.nextParent == undefined) this.parentMachine = null;
	else this.parentMachine = this.opts.nextParent;
	this.opts.nextParent = this; //
	
	/*
	 * @param childrenMachine - list of children of the current machine
	 */
	this.childrenMachine	= new Array();
	if (this.parentMachine) this.parentMachine.childrenMachine.push(this);//update the children of the parent if any 

	var aState;
	var aEvent;
	var theEvents	='';
	var space		='';
	var theTarget=$(document);
	var attrChangeRequested 		= false;
	var attrStyleChangeRequested 	= false;
	var attrChangeEvents 			= new Array();
	var setStart 	= false;
	
	
	//look for all the defined and unique events
	for(aState in this._stateDefinition) 
	{
		for(aEvent in this._stateDefinition[aState]) 
		{
			// filter to the events list not subscribed by the root machine
			// start is always sent to the current machine
			if (!this.rootMachine.listEvents[aEvent] 	&& aEvent != 'delegate_machines'
														&& aEvent != this.opts.startEvent)
			{
				this.listEvents[aEvent]=aEvent;
				if (this != this.rootMachine)
					this.rootMachine.listEvents[aEvent]=aEvent;
			}
			else if (aEvent == this.opts.startEvent) setStart= true;
		}
	}
	
	//list all defined events in the FSM in a $.on format
	var splitevent='';
	for(aEvent in this.listEvents) 
	{
		splitevent = aEvent.split('_');
		if ( splitevent[0] == 'attrchange' )
		{
			attrChangeRequested=true;
			attrChangeEvents.push(aEvent);
			if ( (splitevent[1] == 'style') && (splitevent.length > 2) ) 
				attrStyleChangeRequested=true;
		}
		theEvents=theEvents+space+aEvent;
		space=' ';
	}
	
	//define a selector object if none defined
	if ( (anObject.selector == null) 
			||  (
					(anObject.selector == "") 
				&& 	(anObject.attr('id') )
				)
		)
		anObject.selector='#'+anObject.attr('id');// set to the #id
	
	//define the triggers for attrchange
	if ( attrChangeRequested && (anObject.selector) )
	{
		var aStyleListNew;
		var aStyleCssListNew={};
		var aStyleListOld;
		var aStyleCssListOld={};
		var splitres;
		var i;
		var aCssStyle;
		$(anObject.selector).attrchange({
			trackValues: true, // Default to false, if set to true the event object is updated with old and new value.
			callback: function (event) { 
			    //event    	          - event object
			    //event.attributeName - Name of the attribute modified
			    //event.oldValue      - Previous value of the modified attribute
			    //event.newValue      - New value of the modified attribute
			    //Triggered when the selected elements attribute is added/updated/removed
				
				//send trigger event if an attribute change...
				if (jQuery.inArray('attrchange', attrChangeEvents)>=0) 
					$(this).trigger('attrchange',event);
				//send trigger event on attribute changes
				if (jQuery.inArray('attrchange'+'_'+event.attributeName, attrChangeEvents)>=0) 
					$(this).trigger('attrchange'+'_'+event.attributeName,{newValue:event.newValue,oldValue:event.oldValue});
				//send trigger for the style changes
				if ( (event.attributeName == 'style') && attrStyleChangeRequested) 
				{
					if (event.newValue) aStyleListNew=event.newValue.split(';');
					else aStyleListNew = [];
					if (event.oldValue) aStyleListOld=event.oldValue.split(';');
					else aStyleListOld = [];
					
					for(i= 0; i < aStyleListNew.length; i++)
					{
						splitres=aStyleListNew[i].split(':');
						if (splitres.length==2)
							aStyleCssListNew[splitres[0]]=splitres[1].replace(/^\s+/g,'').replace(/\s+$/g,'');
					}
					for(i= 0; i < aStyleListOld.length; i++)
					{
						splitres=aStyleListOld[i].split(':');
						if (splitres.length==2)
							aStyleCssListOld[splitres[0]]=splitres[1].replace(/^\s+/g,'').replace(/\s+$/g,'');
					}
					for(aCssStyle in aStyleCssListNew) 
					{
						if (aStyleCssListOld[aCssStyle] == undefined
								|| (aStyleCssListOld[aCssStyle] && aStyleCssListOld[aCssStyle] != aStyleCssListNew[aCssStyle])
							)
							$(this).trigger('attrchange_style_'+fsm_manager_getcss3prop(aCssStyle),{newValue:aStyleCssListNew[aCssStyle],oldValue:aStyleCssListOld[aCssStyle]});
					}
				}//end if
				
			}//end callback        
		});	//end attrchange selector
	}//end if	

	//if target object not a document one
	if ($.isWindow(anObject[0])) theTarget = $(window);
	
	//activate the listening of events on object/FSM
	var myFSM=this.rootMachine;
	if (theEvents!='')
		theTarget.on(theEvents, anObject.selector, function( event, dataevent )
		{ 
			myFSM.processEvent(event.type,arguments);
		});

	//activate the start event if defined
	if (setStart)
	{
		var myLocalFSM = this;
		theTarget.on(this.opts.startEvent, anObject.selector, function( event, dataevent )
		{ 
			myLocalFSM.processEvent(event.type,arguments);
		});
	}
	
	this._log('new fsm_manager:'+this.FSMName+'-'+anObject.selector,2);

}//fsm_manager
	
/*available functions*/
/*
 * InitManager - init the One Page Fonction State machine
 * 				- a 'start' event is triggered.
 * public method
 * @aInitState - the init state at start
 */
fsm_manager.prototype.InitManager	= function(aInitState) 
{
	this._log('InitManager');
	
	if (aInitState==undefined)
		this.currentState		= 'DefaultState';
	else
		this.currentState		= aInitState;

	if (this._stateDefinition['DefaultState']==undefined)
		this._stateDefinition.DefaultState={};
	
	this.trigger(this.opts.startEvent);
	
};//

/*
 * procesEvent - process an event according to the current state
 * public Method
 * @param string 	anEvent 	: an event name 
 * @param Array 	data		: arguments sent by the triggering event [event, dataevent]
 * @param boolean 	forceProcess: force event to be processed
 * @return void 
 * @comment
 * 	it is possible to pass the FSM Object to test the target through 'data' : data[data.length-1].targetFSM
 * 	ex : the function this.trigger always send the FSM through this way;
 */
fsm_manager.prototype.processEvent= function(anEvent,data,forceProcess) {
		
		var currentState = this.currentState;
		var currentEvent = data[0];
		var currentStateEvent = this.currentState;
		var doForceProcess = (forceProcess==undefined?false:true)


		this._log('processEvent: anEvent (currentState) machine name ---> '+anEvent+'('+currentState+')-'+this.FSMName,2);

		//targetFSM is sent through the this.trigger function
		//we consider the sub FSMs of a machine as the same machine...
		if (data.length > 1
				&& data[data.length-1].targetFSM 
				&& (data[data.length-1].targetFSM != this)
				&& (data[data.length-1].targetFSM.rootMachine != this.rootMachine)
			)
		{
			this._log('processEvent: not for the current machine ---> exit',2);
			return; //not for this machine...
		}
		
		if (this._stateDefinition[currentState]==undefined)
		{
			this._log('processEvent: currentState does not exist! ---> ('+currentState+')',1);
			return;
		}
		
		if ( ( anEvent == 'enterState' ) || ( anEvent == 'exitState' ) ) doForceProcess = true;
		
		//element is not a right target...?
		if (
					!this.myUIObject.is(currentEvent.currentTarget) 
				&&	!this.myUIObject.is(currentEvent.target) 
				&& 	(this.myUIObject[0] != document) 
				&& !$.isWindow(currentEvent.currentTarget)
				&& !$.isWindow(currentEvent.target)
			) 
		{
			this._log('processEvent: object not a good target  ---> '+$(currentEvent.currentTarget).attr('id'),2);
			return;
		}
		else
		{
			if (this.myUIObject[0] == document) this.actualTarget=$(document);
			else this.actualTarget = $(currentEvent.currentTarget);
		}
		
		var currentEventConfiguration = null;
		currentEventConfiguration = this._stateDefinition[currentState][anEvent];
		
		//if we are still processing we push the event, except if explicitly asked otherwise
		//see if we should push the event
		if (	doForceProcess == false 
				&& this.processEventStatus != 'idle'
				&& (
						currentEventConfiguration == undefined
						|| ( 	currentEventConfiguration
								&& 	currentEventConfiguration.how_process_event == undefined
							)
						|| ( 	currentEventConfiguration
								&& 	currentEventConfiguration.how_process_event
								&& 	currentEventConfiguration.how_process_event.immediate == undefined
								&& 	currentEventConfiguration.how_process_event.delay == undefined
						)
					)
			)
		{
			this._log('processEvent: Push anEvent (lastevent)---> '+anEvent+' ('+this.lastevent+')',2);
			this.pushEvent(anEvent,data);
			return;
		}

		this.lastevent=currentState+'-'+anEvent;//unused...mainly for debug...
		
		// we try to process the event in any sub machines...
		if ( ( this._stateDefinition[currentState].delegate_machines ) 
			)
		{
			var aSubMachineDefinition;
			for(aSubMachine in this._stateDefinition[currentState].delegate_machines) 
			{
				this._log('processEvent: delegate to submachine---> '+aSubMachine);
				aSubMachineDefinition = this._stateDefinition[currentState].delegate_machines[aSubMachine];
				
				//initialize the sub machines if needed
				if (aSubMachineDefinition.myFSM == undefined)
				{
					this._stateDefinition[currentState].delegate_machines[aSubMachine].myFSM = new fsm_manager(this.myUIObject,aSubMachineDefinition.submachine,this.opts); //create the machine
					this._stateDefinition[currentState].delegate_machines[aSubMachine].myFSM.opts.FSMParent=this;
					this._stateDefinition[currentState].delegate_machines[aSubMachine].myFSM.InitManager();
				}
				
				// process event except on the enterState and exitState events that are not to be delegated...
				if 	( ( anEvent != 'enterState' ) && ( anEvent != 'exitState' ) ) 
				{
					this._log('processEvent: process submachine (event)---> '+aSubMachine+'('+anEvent+')',2);
					aSubMachineDefinition.myFSM.processEvent(anEvent,data,true);
				
					if (		
								(	aSubMachineDefinition.myFSM._stateDefinition[aSubMachineDefinition.myFSM.currentState][anEvent]
								&& 	aSubMachineDefinition.myFSM._stateDefinition[aSubMachineDefinition.myFSM.currentState][anEvent].prevent_bubble
								)
							||
								(	aSubMachineDefinition.myFSM._stateDefinition.DefaultState[anEvent]
								&& 	aSubMachineDefinition.myFSM._stateDefinition.DefaultState[anEvent].prevent_bubble
								)
							|| 	anEvent == 'start'
						)
					{
						this._log('processEvent: submachine processed and direct exit ',2);

						this.cleanExitProcess();
						return;
					}
				}
			}
		}
		
		// we now process the event in the current state
		if (currentEventConfiguration == undefined)
		{
			currentEventConfiguration = this._stateDefinition.DefaultState[anEvent];
			if (currentEventConfiguration == undefined) {
				this._log('processEvent: Event does not exist? '+anEvent);

				this.cleanExitProcess();
				return;
			}
			currentStateEvent = 'DefaultState';
		}
		
		//look if event is processed when coming from any target 
		if (	!this.myUIObject.is(currentEvent.target) 
				&& 	(this.myUIObject[0] != document) 
				&& !$.isWindow(currentEvent.currentTarget)
				&& !$.isWindow(currentEvent.target)
				&& (!currentEventConfiguration.process_on_UItarget
						|| 	currentEventConfiguration.process_on_UItarget == false)
			)
		{
			this.cleanExitProcess();
			return;
		}

		//look if we let the bubbling of UI event on this event
		// no bubbling by default
		if (	(this.myUIObject[0] != document) 
				&& (!currentEventConfiguration.UI_event_bubble
						|| 	currentEventConfiguration.UI_event_bubble==false
					)
			)
			currentEvent.stopPropagation();

		if 	( 	doForceProcess == false
				&& currentEventConfiguration
				&& 	currentEventConfiguration.how_process_event
				&& 	currentEventConfiguration.how_process_event.delay
			)
		{
			this.delayProcess(anEvent, currentEventConfiguration.how_process_event.delay, data);
			this.cleanExitProcess();
			return;
		}

		if (this._stateDefinition[currentStateEvent][anEvent].EventIteration == undefined)
			this._stateDefinition[currentStateEvent][anEvent].EventIteration =0;

		this._stateDefinition[currentStateEvent][anEvent].EventIteration++;
		this.EventIteration = this._stateDefinition[currentStateEvent][anEvent].EventIteration;
		
		//verify if the event can be processed according to enter condition
		if 	(		(currentEventConfiguration.process_event_if)
				&& 	(eval(currentEventConfiguration.process_event_if) == false)					
			)
		{
			this._log('processEvent: event not allowed to process ');
			if 	(currentEventConfiguration.propagate_event_on_refused)
			{
				this._log('processEvent: propagate_event_on_refused ---> '+anEvent+'-'+currentEventConfiguration.propagate_event_on_refused);
				this.trigger(currentEventConfiguration.propagate_event_on_refused);
			}
			//exit as not accepted...
			this.cleanExitProcess();
			return;
		}

		//ok we will process this event...
		var lastprocessEventStatus = this.processEventStatus;
		this.processEventStatus = 'processing';
		
		var funcReturn = true;
		var localdata;

		//call to the action before transition state
		if (currentEventConfiguration.init_function) 
		{
			localdata = [].slice.call(data);
			localdata.unshift(currentEventConfiguration.properties_init_function);
			funcReturn= currentEventConfiguration.init_function.apply(this,localdata);
			this._log('processEvent: anEvent / function done ---> '+anEvent);
		}
		
		//transition
		if ( 	(funcReturn != false) 
			&& 	(currentEventConfiguration.next_state) 
			&& 	(currentState != currentEventConfiguration.next_state) 
			&&	(
					(currentEventConfiguration.next_state_when == undefined)
				|| 	(eval(currentEventConfiguration.next_state_when) == true)					
				)
			)
		{
			//we reinit the iteration on the event
			this._stateDefinition[currentStateEvent][anEvent].EventIteration =0;

			//we cancel any waiting events on the state
			this.cancelDelayedProcess();
			
			//we alert that we're exiting the state
			var anEv = data;
			anEv[0].type='exitState';
			this.processEvent('exitState',anEv,true);

			//we change the current state
			this.currentState = currentEventConfiguration.next_state;
			
			//and now that we're entering the new state
			anEv[0].type='enterState';
			this.processEvent('enterState',anEv,true);

			//propagate event if asked
			this._log('processEvent: new state ---> '+this.currentState);

			if 	(currentEventConfiguration.propagate_event != undefined)
			{
				//on propage que si état différent... attention tout de même aux boucles!
				this._log('processEvent: trigger event ---> '+anEvent+'-'+currentEventConfiguration.propagate_event);
				if (currentEventConfiguration.propagate_event === true) 
					this.trigger( anEvent, data[1]);
				else
					this.trigger( currentEventConfiguration.propagate_event, data[1]);
			}
		}
		else if ( 	(funcReturn != false) 
				&& (currentEventConfiguration.propagate_event != undefined)
			)
		{
			//propagate if the event is different from the current one... but user should take care of loop!
			this._log('processEvent: trigger event same state ---> '+anEvent+'-'+currentEventConfiguration.propagate_event);
			if (currentEventConfiguration.propagate_event === true) 
				this.trigger( anEvent, data[1]);
			else if (currentEventConfiguration.propagate_event != anEvent) //to avoid loop
				this.trigger( currentEventConfiguration.propagate_event, data[1]);
		}
		//oups there was an error during the processing of the action
		else if ( (funcReturn == false) && (currentEventConfiguration.next_state_if_error) )
		{
			this._log('processEvent: error state ---> '+this.currentState);
			this.currentState = currentEventConfiguration.next_state_if_error;
		}
		
		this.processEventStatus = lastprocessEventStatus; //we globally finished the job...
		
		// do the exit action
		if (currentEventConfiguration.out_function) 
		{
			localdata = [].slice.call(data);
			localdata.unshift(currentEventConfiguration.properties_out_function);
			funcReturn= currentEventConfiguration.out_function.apply(this,localdata);
			this._log('processEvent: end out---> '+anEvent);
		}

		this.cleanExitProcess();
		this._log('processEvent: exit:'+anEvent);

};//end of processEvent

/*
 * cleanExitProcess - clean for exit the processing of an event
 */
fsm_manager.prototype.cleanExitProcess	= function(anEvent,data) {
	// processing lasting events
	//we don't process the events if we were currently on an immediate event...
	if (
				(this.pushEventList.length) 
			&& 	(this.processEventStatus == 'idle' || this.pushEventList.length>this.opts.maxPushEvent)
		)
	{
		this.popEvent();
	}
}

/*
 * pushEvent - push an event
 * private Method 
 * @param anEvent 	: an event name 
 * @param data		: {event, data}
 */
fsm_manager.prototype.pushEvent	= function(anEvent,data) {
	this._log('pushEvent:  ---> '+anEvent,2);
	if (this.pushEventList.length>this.opts.maxPushEvent) 
	{
		this._log('pushEvent: too much events...  ---> '+this.pushEventList.length,2);
		return;
	}
	var anEventToPush =  {anEvent:anEvent, data:data};
	this.pushEventList.push( anEventToPush );
	this._log('pushEvent: push  nb event ---> '+this.pushEventList.length);
};
						
/*
 * popEvent - pop an event and process it 
 * private Method 
 * 		we process event in a FIFO order
 */
fsm_manager.prototype.popEvent	= function() {
	this._log('popEvent');
	if (this.pushEventList.length > 0)
	{
		anEventToProcess = this.pushEventList.shift();
		this._log('popEvent:'+anEventToProcess.anEvent);
		if (anEventToProcess == undefined || anEventToProcess.anEvent == undefined) return false;
		this.processEvent(anEventToProcess.anEvent,anEventToProcess.data);
		return true;
	}
	else this._log('popEvent void list');
	return false;
};//
					
/*
 * delayProcess - push an event after a delay
 * private Method 
 * @param anEvent 	: an event name 
 * @param aDelay	: a delay to do the processing
 * @param data		: {event, data}
 */
fsm_manager.prototype.delayProcess	= function(anEvent, aDelay, data) {
	this._log('delayProcess:  ---> '+anEvent);
	//setTimeout(this.launchProcess,aDelay,this,anEvent,data);
	jQuery.doTimeout(this.myUIObject.attr('id')+this._stateDefinition[this.currentState]+anEvent,aDelay,fsm_manager_launchProcess,this,anEvent,data);
};

/*
 * cancelDelayedProcess - delete all delayed events of the current state except those declared as prevented
 * public Method 
 */
fsm_manager.prototype.cancelDelayedProcess	= function() {
	this._log('cancelDelayedProcess:  ---> ');
	var currentEventConfiguration;
	for(aEvent in this._stateDefinition[this.currentState]) 
	{
		currentEventConfiguration = this._stateDefinition[this.currentState][aEvent];
		if 	( 	 	currentEventConfiguration.how_process_event
				&& 	(		currentEventConfiguration.how_process_event.preventcancel == undefined
						||  currentEventConfiguration.how_process_event.preventcancel != true
					)
			)
			jQuery.doTimeout(this._stateDefinition[this.currentState]+aEvent);//cancel event
	}

};
/*
 * launchProcess - 
 * private Method 
 * @param anEvent 	: an event name 
 * @param aDelay	: a delay to do the processing
 * @param data		: {event, data}
 */
fsm_manager_launchProcess	= function(aFsm, anEvent, data) {
	aFsm._log('launchProcess:  ---> '+anEvent);
	aFsm.processEvent(anEvent,data,true);
};


/*
 * this.trigger - trigger an event to the machine
 * public function
 * @param aEventName - name of an event
 * @param data parameters linked to the event
 */
fsm_manager.prototype.trigger = function (aEventName) {
	var myArgs = Array.prototype.slice.call(arguments);
	myArgs.push({targetFSM:this});
	myArgs.shift();
	this.myUIObject.trigger(aEventName,myArgs);
};//end of 

/*
 * this._log - log function
 * private function
 * @param message - message to log
 * @param error_level (default : 3) 	
 * 			- 1 : it's an error
 * 			- 2 : it's a warning
 * 			- 3 : it's a notice
 * 
 */
fsm_manager.prototype._log = function (message) {
	/*global console:true */
	
	if (!this.opts.debug) return;
	if ( (arguments.length > 1) && (arguments[1] > this.opts.LogLevel) ) return; //on ne continue que si le nv de message est <= LogLevel
	else if ( (arguments.length <= 1) && (3 > this.opts.LogLevel) ) return;// pas de niveau de msg défini => niveau notice (3)
	
	if (window.console && console.log)
	{
		console.log('[fsm] ' + message);
		if ( (arguments[1] == 1) && this.opts.AlertError) alert(message);
	}
	
};//end of 

/*
 * functions that can be used for the events of a state machine
 */

/* 
 * triggerMe - trigger an event on an object
 * 				to be used within a state function
 * example :
 * 				init_function 				: fsm_manager_triggerMe,
 * 				properties_init_function 	: {objectToTrigger:'#myButton',eventNameToTrigger:'click'} ,
 * @param objectParameters
 * 	- {objectToTrigger: a jquery selector ,eventNameToTrigger: a event name to trigger}
 * @param event - the FSM event that called the function
 * @param data - the FSM event data
 * 
 * @param this - the FSM object (well... if called in a state function)
 */
fsm_manager_triggerMe = function(objectParameters, event, data)
{
	this._log('[fsm_manager_triggerMe]'+$(objectParameters.objectToTrigger).attr('id')+'-'+objectParameters.eventNameToTrigger);
	
	$(objectParameters.objectToTrigger).trigger( objectParameters.eventNameToTrigger );
}

/*
 * fsm_manager_getcss3prop - 
 * 	pass in an unaltered CSS property, and the function will return the vendor specific JavaScript equivalent property 
 * 	supported by the browser
 * @param string cssprop - a css property
 * 
 * <code>
 * getcss3prop('border-radius'); // returns 'borderRadius' or one of the variants, such as 'MozBorderRadius', 'WebkitBorderRadius' etc
 * </code>
 */
function fsm_manager_getcss3prop(cssprop){
    var css3vendors = ['', '-moz-','-webkit-','-o-','-ms-','-khtml-']
    var root = document.documentElement
    function camelCase(str){
        return str.replace(/\-([a-z])/gi, function (match, p1){ // p1 references submatch in parentheses
            return p1.toUpperCase() // convert first letter after "-" to uppercase
        })
    }
    for (var i=0; i<css3vendors.length; i++){
        var css3propcamel = camelCase( css3vendors[i] + cssprop )
        if (css3propcamel.substr(0,2) == 'Ms') // if property starts with 'Ms'
            css3propcamel = 'm' + css3propcamel.substr(1) // Convert 'M' to lowercase
        if (css3propcamel in root.style)
            return css3propcamel
    }
    return undefined
}
