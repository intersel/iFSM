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
 * -----------------------------------------------------------------------------------------
 * @copyright : Intersel 2013
 * @author : Emmanuel Podvin - emmanuel.podvin@intersel.fr
 * @version : 1.2
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
 * 		<aEventName1>:
 * 		{
 * 			how_process_event: <immediate||push||{delay:<adelay>,preventcancel:<false(default)|true>}>,
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
 * 		},
 * 		<aEventName....>:
 * 		{
 * 			....
 * 		},
 * 		'enterState' : ...
 * 		'exitState' :  ...
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
 *   		- init_function  : function name
 *   		- properties_init_function : parameters to send to init_function
 *   		- next_state : next state once init_function done
 *   		- next_state_when : 
 *   			Definition of condition test that will be evaluated, and if result is true then state will change
 *   			Following variables may be used for the test
 *   			EventIteration : variable that gives the iteration of the number of calls of the current event. 
 *   							 EventIteration is reset when the state changes
 *   			this	: the FSM object
 *   		- out_function	 : function name to do once next_state changed
 *   		- properties_out_function : parameters to send to out_function
 *   		- next_state_if_error (default: does not change state) : state set if init_function return false
 *   		- propagate_event : if defined, the current event is propagated to the next state
 *   							if it's the name of an event, triggers the event...
 *   
 * @remarks
 *   - state function should return a boulean : true: ok works fine; false: error
 *   - state function should have the following input :
 *   	- parameters : the properties_<init/out>_function
 *   	- event : the event 
 *   	- data : the data sent with the event
 *   - event trigger should be sent at the end of the state function with a return just behind...
 *   - state function should have one argument : data
 *   - a default statename 'DefaultState' can be defined to define the default behaviour of some events... 
 *   - an event is first search in the current state, then if not found in the 'DefaultState'
 *   - if an event is not found, nothing is done...
 *   - it will be applied if there is no event definition in the current state
 *   - a 'start' event is triggered when the FSM is started with InitManager
 *   - 
 *   
 * the public available variables :
 * 	- myFSM.currentState
 *  - myFSM._stateDefinition
 *  - myFSM._stateDefinition.<statename>.<eventname>.EventIteration
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
 */
	
var fsm_manager =  function (anObject, aStateDefinition, options)
{
	var $defaults = {
			debug				: true,
			LogLevel			: 3,
			AlertError			: false
		}
		
	// on charge les options passées en paramètre
	if (options == undefined) options=null;
	this.opts = jQuery.extend( {}, $defaults, options || {});
	
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

	var aState;
	var aEvent;
	var listEvents	={};
	var theEvents	='';
	var space		='';
	var theTarget=$(document);
	var attrChangeRequested 		= false;
	var attrStyleChangeRequested 	= false;
	var attrChangeEvents 			= new Array();

	//look for all the defined and unique events
	for(aState in this._stateDefinition) {
		for(aEvent in this._stateDefinition[aState]) {
			listEvents[aEvent]=aEvent;
		}
	}
	
	//list all defined events in the FSM in a $.on format
	var splitevent='';
	for(aEvent in listEvents) 
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
	
	var myFSM=this;
	if (theEvents!='')
		theTarget.on(theEvents, anObject.selector, function( event, dataevent )
		{ 
			myFSM.processEvent(event.type,arguments);
		});

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
	
	this.myUIObject.trigger('start');
	
};//

/*
 * procesEvent - process an event according to the current state
 * public Method
 * @param string anEvent 	: an event name 
 * @param Array data		: arguments sent by the triggering event {event, data}
 * @return void 
 */
fsm_manager.prototype.processEvent= function(anEvent,data,forceProcess) {
		
		var currentState = this.currentState;
		var currentStateEvent = this.currentState;
		var funcReturn = true;
		var currentEventConfiguration = null;
		var lastprocessEventStatus = this.processEventStatus;
		var doForceProcess = (forceProcess==undefined?false:true)
		var localdata;
		var currentEvent = data[0];
		var EventIteration;

		this._log('processEvent: anEvent (currentState) target ---> '+anEvent+'('+currentState+')-'+$(currentEvent.target).attr('id'),2);

		if (this._stateDefinition[currentState]==undefined)
		{
			this._log('processEvent: currentState does not exist! ---> ('+currentState+')',3);
			return;
		}
		
		if ( ( anEvent == 'enterState' ) || ( anEvent == 'exitState' ) ) doForceProcess = true;
		
		currentEventConfiguration = this._stateDefinition[currentState][anEvent];
		
		//element is not a right target...
		if (!this.myUIObject.is(currentEvent.target) && !$.isWindow(currentEvent.target)) 
		{
			this._log('processEvent: object not a good target  ---> '+$(currentEvent.target).attr('id'),2);
			return;
		}
		

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
			this._log('processEvent: Push anEvent ---> '+anEvent,2);
			this.pushEvent(anEvent,data);
			return;
		}

		if (currentEventConfiguration == undefined)
		{
			currentEventConfiguration = this._stateDefinition.DefaultState[anEvent];
			if (currentEventConfiguration == undefined) {
				this._log('processEvent: Event does not exist? '+anEvent);
				return;
			}
			currentStateEvent = 'DefaultState';
		}

		if 	( 	doForceProcess == false
				&& currentEventConfiguration
				&& 	currentEventConfiguration.how_process_event
				&& 	currentEventConfiguration.how_process_event.delay
			)
		{
			this.delayProcess(anEvent, currentEventConfiguration.how_process_event.delay, data);
			return;
		}

		//verify if the event can be processed according to enter condition
		if 	(		(currentEventConfiguration.process_event_if)
				&& 	(eval(currentEventConfiguration.process_event_if) == false)					
			)
		{
			this._log('processEvent: event not allowed to process ');
			if 	(currentEventConfiguration.propagate_event_on_refused)
			{
				this._log('processEvent: propagate_event_on_refused ---> '+anEvent+'-'+currentEventConfiguration.propagate_event_on_refused);
				this.myUIObject.trigger(currentEventConfiguration.propagate_event_on_refused);
			}
			//exit as not accepted...
			return;
		}

		//ok we will process this event...
		this.processEventStatus = 'processing';
		
		
		if (this._stateDefinition[currentStateEvent][anEvent].EventIteration == undefined)
			this._stateDefinition[currentStateEvent][anEvent].EventIteration =0;

		this._stateDefinition[currentStateEvent][anEvent].EventIteration++;
		EventIteration = this._stateDefinition[currentStateEvent][anEvent].EventIteration;
		
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
			this.myUIObject.trigger('exitState');

			//we change the current state
			this.currentState = currentEventConfiguration.next_state;
			
			//and now that we're entering the new state
			this.myUIObject.trigger('enterState');

			//propagate event if asked
			this._log('processEvent: new state ---> '+this.currentState);

			if 	(currentEventConfiguration.propagate_event != undefined)
			{
				//on propage que si état différent... attention tout de même aux boucles!
				this._log('processEvent: trigger event ---> '+anEvent+'-'+currentEventConfiguration.propagate_event);
				if (currentEventConfiguration.propagate_event == null) 
					this.myUIObject.trigger( anEvent, data[1]);
				else
					this.myUIObject.trigger( currentEventConfiguration.propagate_event, data[1]);
			}
		}
		else if ( 	(funcReturn != false) 
				&& (currentEventConfiguration.propagate_event != undefined)
			)
		{
			//propagate if the event is different from the current one... but user should take care of loop!
			this._log('processEvent: trigger event same state ---> '+anEvent+'-'+currentEventConfiguration.propagate_event);
			if (currentEventConfiguration.propagate_event == null) 
				this.myUIObject.trigger( anEvent, data[1]);
			else if (currentEventConfiguration.propagate_event != anEvent) //to avoid loop
				this.myUIObject.trigger( currentEventConfiguration.propagate_event, data[1]);
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

		// processing lasting events
		//we don't process the events if we were currently on an immediate event...
		if (this.processEventStatus == 'idle')
			while (this.popEvent());

		this._log('processEvent: popevent done ---> ');

};//end of processEvent


/*
 * pushEvent - push an event
 * private Method 
 * @param anEvent 	: an event name 
 * @param data		: {event, data}
 */
fsm_manager.prototype.pushEvent	= function(anEvent,data) {
	this._log('pushEvent:  ---> '+anEvent);
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
 * this._log - petite fonction de log pour activer le debug
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
	
	if ( (arguments.length > 1) && (arguments[1] > this.opts.LogLevel) ) return; //on ne continue que si le nv de message est <= à LogLevel
	else if ( (arguments.length <= 1) && (3 > this.opts.LogLevel) ) return;// pas de niveau de msg défini => niveau notice (3)
	
	if (window.console && console.log && this.opts.debug)
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
 * @param objectParameters
 * 	- {objectToTrigger: a jquery selector ,eventNameToTrigger: a event name to trigger}
 * @param event - the FSM event that called the function
 * @param data - the FSM event data
 * 
 * @param this - the FSM object 
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
