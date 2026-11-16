import { Injectable } from "@angular/core";
import { Source } from "./models/source";
import { BehaviorSubject, Subject } from "rxjs";
import { MatMenuTrigger } from "@angular/material/menu";
import { ToastrService } from "ngx-toastr";
import { ErrorService } from "./error.service";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { invoke } from "@tauri-apps/api/core";
import { SortType } from "./models/sortType";
import { LAST_SEEN_VERSION } from "./models/localStorage";
import { SetNodeDTO } from "./models/setNodeDTO";

@Injectable({
  providedIn: "root",
})
export class MemoryService {
  constructor(
    private toastr: ToastrService,
    private error: ErrorService,
  ) {
    invoke("is_container").then((val) => (this.IsContainer = val as boolean));
  }
  public SetNode: Subject<SetNodeDTO> = new Subject();
  public SetFocus: Subject<number> = new Subject();
  public Sort: BehaviorSubject<[number, boolean]> = new BehaviorSubject<[number, boolean]>([
    SortType.provider,
    false,
  ]);
  public Sources: Map<number, Source> = new Map();
  public currentContextMenu?: MatMenuTrigger;
  public Loading = false;
  /** True while sources are refreshing; locks the whole UI behind an overlay */
  public Refreshing = false;
  public Refresh: Subject<boolean> = new Subject();
  public RefreshSources: Subject<boolean> = new Subject();
  public AddingAdditionalSource = false;
  public SeriesRefreshed: Map<number, boolean> = new Map();
  public HideChannels: Subject<boolean> = new Subject();
  public CustomSourceIds: Set<number> = new Set();
  public XtreamSourceIds: Set<number> = new Set();
  public ModalRef?: NgbModalRef;
  public Watched_epgs: Set<string> = new Set();
  private downloadingChannels: Map<number, [number, Subject<boolean>]> = new Map();
  public LoadingNotification: boolean = false;
  public AppVersion?: string;
  public trayEnabled?: boolean;
  public IsContainer?: boolean;
  public AlwaysAskSave?: boolean;

  async tryIPC<T>(
    successMessage: string,
    errorMessage: string,
    action: () => Promise<T>,
  ): Promise<boolean> {
    this.Loading = true;
    let error = false;
    try {
      await action();
      this.toastr.success(successMessage);
    } catch (e) {
      this.error.handleError(e, errorMessage);
      error = true;
    }
    this.Loading = false;
    return error;
  }

  /**
   * Run a source refresh: close all open channels, lock the UI with the
   * refresh overlay, then run the action. Returns true on error (like tryIPC).
   */
  async refreshSources<T>(
    successMessage: string,
    errorMessage: string,
    action: () => Promise<T>,
  ): Promise<boolean> {
    if (this.Refreshing) return true;
    this.Refreshing = true;
    (document.activeElement as HTMLElement | null)?.blur();
    try {
      try {
        await invoke("close_all_channels");
      } catch (e) {
        console.error("Failed to close open channels before refresh", e);
      }
      return await this.tryIPC(successMessage, errorMessage, action);
    } finally {
      this.Refreshing = false;
    }
  }

  async get_epg_ids() {
    let data = await invoke("get_epg_ids");
    let set = new Set(data as Array<string>);
    this.Watched_epgs = set;
  }

  addDownloadingChannel(id: number) {
    this.downloadingChannels.set(id, [0, new Subject()]);
  }

  notifyDownloadFinished(id: number) {
    this.downloadingChannels.get(id)?.[1].next(true);
  }

  removeDownloadingChannel(id: number) {
    this.downloadingChannels.delete(id);
  }

  downloadExists(id: number) {
    return this.downloadingChannels.has(id);
  }

  getDownload(id: number) {
    return this.downloadingChannels.get(id);
  }

  setLastDownloadProgress(id: number, progress: number) {
    this.downloadingChannels.get(id)![0] = progress;
  }

  updateVersion() {
    if (this.AppVersion) localStorage.setItem(LAST_SEEN_VERSION, this.AppVersion);
  }
}
