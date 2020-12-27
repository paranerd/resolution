import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { Item } from '@app/models/item.model';

// https://dev.to/alfredoperez/angular-service-to-handle-state-using-behaviorsubject-4818

const INITIAL_STATE: State = {
    items: [],
    page: null,
    pages: null,
    current: null,
    test: null,
};

@Injectable({
    providedIn: 'root'
})

export class StateService {
    private _state = new BehaviorSubject<State>(INITIAL_STATE);

    state = this._state.asObservable();

    /**
     * Returns an observable for a property on the store.
     * This is used when the consumer needs the stream of changes
     * for the property observed.
     *
     * @param key - the key of the property to be retrieved
     */
    public select<K extends keyof State>(key: K): Observable<State[K]> {
        return this._state.asObservable().pipe(pluck(key));
    }

    /**
     * Gets the current state of a property.
     * This is used when the consumer needs just the current state
     *
     * @param key - the key of the property to be retrieved
     */
    public selectSnapshot<K extends keyof State>(key: K): State[K] {
        return this._state.value[key];
    }

    /**
     * This is used to set a new value for a property
     *
     * @param key - the key of the property to be retrieved
     * @param data - the new data to be saved
     */
    public set<K extends keyof State>(key: K, data: State[K]) {
        this._state.next({ ...this._state.value, [key]: data });
    }

    /**
     * Sets values for multiple properties on the store
     * This is used when there is a need to update multiple properties in the store
     *
     * @param partialState - the partial state that includes the new values to be saved
     */
    public setState(partialState: Partial<State>): void {
        const currentState = this._state.value;
        const nextState = Object.assign({}, currentState, partialState);

        this._state.next(nextState);
    }

    get items(): Item[] {
        return this._state.value.items;
      }

  constructor() { }
}

export interface State {
    items: Array<Item>;
    page: number;
    pages: number;
    current: number;
    test: number;
}