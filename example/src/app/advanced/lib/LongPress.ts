/**
 * Custom google-maps @event LongClick hack.
 */

 declare var google;

 export class LongPress {
  private maxTime:number;
  private isDragging:boolean;
  private longPressTimer:any;
  private isLongPress:boolean;
  private map:any;

  constructor(map:any, maxTime:number) {
    this.maxTime = maxTime;
    this.map = map;
    this.longPressTimer = undefined;
    this.isLongPress = false;

    google.maps.event.addListener(map, 'mousedown', (e) => {
        this.onMouseDown(e);
    });
    google.maps.event.addListener(map, 'click', (e) => {
        this.onMouseClick(e);
    });
    google.maps.event.addListener(map, 'mouseup', (e) => {
        this.onMouseUp(e);
    });
    google.maps.event.addListener(map, 'drag', (e) => {
        this.onMapDrag(e);
    });
  }

  private onMouseClick(e) {
    this.clearTimer();
    this.isLongPress = false;
  }
  private onMouseUp(e) {
    if (this.isLongPress && this.isDragging === false) {
        google.maps.event.trigger(this.map, 'longpress', e);
    }
    this.clearTimer();
  }
  private onMouseDown(e) {
    this.clearTimer();
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      google.maps.event.trigger(this.map, 'longpresshold', e);
    }, this.maxTime);
    this.isDragging = false;
  }
  private onMapDrag(e) {
    if (this.isLongPress) {
        google.maps.event.trigger(this.map, 'longpresscancel');
    }
    this.clearTimer();
    this.isDragging = true;
  }
  private clearTimer() {
    this.isLongPress = false;
    if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = undefined;
    }
  }
}