const _ = require('underscore');

const BaseStepWithPipeline = require('./basestepwithpipeline.js');
const SimpleStep = require('./simplestep.js');
const Event = require('../event.js');

class AtomicEventWindow extends BaseStepWithPipeline {
    constructor(game, eventProperties, handler) {
        super(game);

        this.events = _.map(eventProperties, event => new Event(event.name, event.params));
        this.handler = handler || (() => true);

        this.pipeline.initialise([
            new SimpleStep(game, () => this.openWindow('cancelinterrupt')),
            new SimpleStep(game, () => this.openWindow('forcedinterrupt')),
            new SimpleStep(game, () => this.openWindow('interrupt')),
            new SimpleStep(game, () => this.executeHandler()),
            new SimpleStep(game, () => this.openWindow('forcedreaction')),
            new SimpleStep(game, () => this.openWindow('reaction'))
        ]);
    }

    openWindow(abilityType) {
        this.filterOutCancelledEvents();

        if(_.isEmpty(this.events)) {
            return;
        }

        this.game.openAbilityWindow({
            abilityType: abilityType,
            event: this.events
        });
    }

    filterOutCancelledEvents() {
        this.events = _.reject(this.events, event => event.cancelled);
    }

    executeHandler() {
        this.filterOutCancelledEvents();

        if(_.isEmpty(this.events)) {
            return;
        }

        this.handler();

        _.each(this.events, event => {
            this.game.emit(event.name, ...event.params);
        });
    }
}

module.exports = AtomicEventWindow;
