import { Component, Input } from "@angular/core";

@Component({
  selector: "app-loading",
  templateUrl: "./loading.component.html",
  styleUrl: "./loading.component.css",
})
export class LoadingComponent {
  @Input()
  center: boolean = false;
  @Input()
  texts: string[] = ["Loading your channels..."];
  count = 0;
  private interval?: ReturnType<typeof setInterval>;

  currentText: string = "";

  ngOnInit() {
    this.displayRandomText();
    this.interval = setInterval(() => this.displayRandomText(), 3500);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  displayRandomText() {
    if (this.count == this.texts.length) this.count = 0;
    this.currentText = this.texts[this.count++];
  }
}
