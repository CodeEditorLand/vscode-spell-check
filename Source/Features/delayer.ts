"use strict";

export interface ITask<T> {
	(): T;
}

export class Delayer<T> {
	public defaultDelay: number;

	private timeout: any; // Timer
	private completionPromise: Promise<T>;

	private onSuccess: (value?: T | Thenable<T>) => void;

	private task: ITask<T>;

	constructor(defaultDelay: number) {
		this.defaultDelay = defaultDelay;

		this.timeout = null;

		this.completionPromise = null;

		this.onSuccess = null;

		this.task = null;
	}

	public trigger(
		task: ITask<T>,
		delay: number = this.defaultDelay,
	): Promise<T> {
		this.task = task;

		if (delay >= 0) {
			this.cancelTimeout();
		}

		if (!this.completionPromise) {
			this.completionPromise = new Promise<T>((resolve) => {
				this.onSuccess = resolve;
			}).then(() => {
				this.completionPromise = null;

				this.onSuccess = null;

				var result = this.task();

				this.task = null;

				return result;
			});
		}

		if (delay >= 0 || this.timeout === null) {
			this.timeout = setTimeout(
				() => {
					this.timeout = null;

					this.onSuccess(null);
				},
				delay >= 0 ? delay : this.defaultDelay,
			);
		}

		return this.completionPromise;
	}

	public forceDelivery(): Promise<T> {
		if (!this.completionPromise) {
			return null;
		}

		this.cancelTimeout();

		let result = this.completionPromise;

		this.onSuccess(null);

		return result;
	}

	public isTriggered(): boolean {
		return this.timeout !== null;
	}

	public cancel(): void {
		this.cancelTimeout();

		this.completionPromise = null;
	}

	private cancelTimeout(): void {
		if (this.timeout !== null) {
			clearTimeout(this.timeout);

			this.timeout = null;
		}
	}
}
