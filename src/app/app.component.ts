import { Component, HostListener } from "@angular/core";
import { DownloadService } from "./download.service";
import { MemoryService } from "./memory.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  title = "open-tv";

  readonly refreshTexts = ["Refreshing your sources...", "Open channels were closed", "Almost there..."];

  constructor(
    private download: DownloadService,
    public memory: MemoryService,
  ) {
    // Swallow keyboard input while refreshing so shortcuts can't act behind the overlay.
    // Capture phase on window runs before any document/element key handlers.
    const blockKeys = (event: KeyboardEvent) => {
      if (!this.memory.Refreshing) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener("keydown", blockKeys, { capture: true });
    window.addEventListener("keyup", blockKeys, { capture: true });
  }

  @HostListener("document:contextmenu", ["$event"])
  onRightClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isInsideMenuTrigger(target)) {
      return;
    }
    event.preventDefault();
  }

  private isInsideMenuTrigger(element: HTMLElement): boolean {
    return !!element.closest("[mat-menu-trigger-for], [matMenuTriggerFor]");
  }

  showDownloadManager() {
    return this.download.Downloads.size > 0;
  }
}
