// eslint-disable-next-line import/no-nodejs-modules
import assert from 'node:assert';
import { Component, type JSX } from 'preact';
import { ConsoleHistoryPanel, type ConsoleEntry } from './consoleHistoryPanel';

type OnConsoleEventHandler = () => void;

interface ConsolePanelProps {
  isOpen: boolean;
  hotkey: string;
  onOpening: OnConsoleEventHandler;
  onClosing: OnConsoleEventHandler;
  onOpened: OnConsoleEventHandler;
  onClosed: OnConsoleEventHandler;
  percHeight: number; // console label panel height perc wrt to parent cont
  // winHeight: string,
  // fullwinHeight: string,
  prompt: string;
  container: HTMLDivElement;
  history: ConsoleEntry[];
  dispatch: (stmt: string) => void;
  autoCompleteFn: (prefix: string) => string;
  lineHeight: number;
  fontSize: number;
}

interface ConsolePanelState {
  open: boolean;
  // consoleStyle: ConsoleStyle;
  autoScrollNewItems: boolean;
  isGrabbing: boolean;
  grabPos: { top: number; y: number };
  forceScrollTo?: number;
}

class ConsolePanel extends Component<ConsolePanelProps, ConsolePanelState> {
  private static readonly INPUT_PADDING_TOP = 2;
  private static readonly INPUT_PADDING_BOTTOM = 2;

  // panel container
  private container: HTMLDivElement;
  // console label list main element
  private mainEl: HTMLElement | null;
  private listContRef: HTMLElement;
  private inputRef: HTMLInputElement;
  private ctrlDown: boolean;
  private onKeyDown: (event: KeyboardEvent) => void;
  private onFocus: (event: FocusEvent) => void;
  private onMouseDown: (event: MouseEvent) => void;
  private onMouseMove: (event: MouseEvent) => void;
  private onMouseUp: () => void;
  private isClosed: boolean;
  private histLines: string[];
  private histSearchIdx: number;

  constructor(props: ConsolePanelProps) {
    super(props);
    // console.log('constructor');
    this.container = props.container;
    // TODO move ?
    // styleObj.panel.zIndex = Number(this.container.style.zIndex) + 1;
    this.state = {
      open: props.isOpen,
      // consoleStyle: {},
      autoScrollNewItems: true,
      isGrabbing: false,
      grabPos: { top: 0, y: 0 },
      // forceScrollTo: undefined,
    };
    this.isClosed = !props.isOpen;
    // eslint-disable-next-line unicorn/no-null
    this.mainEl = null;
  }

  componentDidMount(): void {
    this.onKeyDown = (event: KeyboardEvent): void => {
      const { key } = event;
      if (key === this.props.hotkey) {
        event.preventDefault();
        this.setOpen(!this.state.open);
      }
    };

    this.container.addEventListener('keydown', this.onKeyDown);

    this.onFocus = (/*event: FocusEvent*/): void => {
      // when closing gui menu (see panels) focus goes back to the main
      // container so we give focus to console container to handle the
      // open/close
      if (this.state.open && this.mainEl) {
        this.mainEl.focus();
      }
    };

    this.container.addEventListener('focus', this.onFocus);

    this.onMouseDown = (e: MouseEvent): void => {
      // console.log('mouseDownHandler');
      const el = this.listContRef;
      // Change the cursor and prevent user from selecting the text
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';

      this.setState({
        grabPos: {
          // The current scroll
          top: el.scrollTop,
          // Get the current mouse position
          y: e.clientY,
        },
        isGrabbing: true,
      });
    };

    this.listContRef.addEventListener('mousedown', this.onMouseDown);

    this.inputRef.focus();
    this.inputRef.value = this.props.prompt;
  }

  componentDidUpdate(
    _prevProps: ConsolePanelProps,
    _prevState: ConsolePanelState,
  ): void {
    this.histLines = this.props.history
      .map((e) => e.stmt)
      .filter((line /*, index, array */) =>
        line.slice(this.props.prompt.length).trim(),
      )
      .filter((line, index, array) => array[index - 1] !== line);

    this.histLines.push(this.props.prompt); // add empty prompt
    this.histSearchIdx = this.histLines.length - 1;

    // console.log('is grabbing: ' + this.state.isGrabbing);
    // console.log(this.state.grabPos);
    // console.log('forceScrollTo: ' + this.state.forceScrollTo);
    // console.log();

    if (this.state.isGrabbing) {
      const mouseMoveHandler =
        this.onMouseMove ??
        ((e: MouseEvent): void => {
          // console.log('mouseMoveHandler');
          // const dy = e.clientY - pos.y;
          const grabPos = {
            // The current scroll
            top: this.state.grabPos.top - (e.clientY - this.state.grabPos.y),
            // Get the current mouse position
            y: e.clientY,
          };
          this.setState((_pState: ConsolePanelState) => ({
            grabPos,
            forceScrollTo: grabPos.top,
          }));
          // setForceScrollTo(pos.top - dy);
          // setForceScrollTo(0);
        });

      this.listContRef.removeEventListener('mousemove', this.onMouseMove);
      this.listContRef.addEventListener('mousemove', mouseMoveHandler);
      this.onMouseMove = mouseMoveHandler;

      const mouseUpHandler =
        this.onMouseUp ??
        ((): void => {
          // console.log('mouseUpHandler');

          const el = this.listContRef;
          el.removeEventListener('mousemove', this.onMouseMove);
          el.removeEventListener('mouseup', this.onMouseUp);

          el.style.cursor = 'grab';
          el.style.removeProperty('user-select');

          this.setState({
            isGrabbing: false,
            autoScrollNewItems: false, // TODO
            // forceScrollTo: undefined,
          });
        });

      this.listContRef.removeEventListener('mouseup', this.onMouseUp);
      this.listContRef.addEventListener('mouseup', mouseUpHandler);
      this.onMouseUp = mouseUpHandler;
    } else {
      // this.listContRef.addEventListener('mousedown', this.onMouseDown);
    }
  }

  releaseHandlers(): void {
    // console.log('remove handlers');
    this.container.addEventListener('keydown', this.onKeyDown);
    this.container.addEventListener('focus', this.onFocus);
    this.listContRef.removeEventListener('mousedown', this.onMouseDown);
    this.listContRef.removeEventListener('mousemove', this.onMouseMove);
    this.listContRef.removeEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount(): void {
    // console.log('unmount');
    this.releaseHandlers();
  }

  private clearInput(): void {
    this.inputRef.value = this.props.prompt;
  }

  private onInputFocus(): void {
    // this.inputRef.value = this.props.prompt;
  }

  public setOpen(open: boolean): void {
    if (open) {
      this.isClosed = false;
    }

    this.setState({ open }, () => {
      // eslint-disable-next-line sonarjs/no-selector-parameter
      if (open) {
        // this.inputRef.focus(); // done later when opened
        this.props.onOpening();
      } else {
        // eslint-disable-next-line github/no-blur
        this.inputRef.blur();
        this.props.onClosing(); // != onHide
      }
    });
  }

  // toggleStyle(style: ConsoleStyle) { // TODO necesary ? remove?
  //   this.setState({ consoleStyle: style });
  // }

  private isCursorOnPrompt(pos: number | null): boolean {
    return Boolean(pos && pos <= this.props.prompt.length);
  }

  private onInputKeyDown(
    event: JSX.TargetedKeyboardEvent<HTMLInputElement>,
  ): void {
    assert(this.inputRef);
    // see note here about the use of preventDefault in onKeydown
    // vs onKeyChange with a react input element
    // stackoverflow.com/q/57807522
    switch (event.key) {
      case this.props.hotkey: {
        event.preventDefault(); // TODO
        break;
      }
      case 'Enter': {
        event.preventDefault(); // TODO
        // const target = event.target as HTMLInputElement;
        this.props.dispatch(this.inputRef.value); // eval the stmt
        if (!this.state.autoScrollNewItems) {
          this.setState({
            autoScrollNewItems: true,
          });
        }
        this.clearInput();
        break;
      }
      case 'Tab': {
        // TODO
        {
          const prefix = this.inputRef.value;
          this.inputRef.value = this.props.autoCompleteFn(prefix);
          event.preventDefault(); // TODO
        }
        break;
      }
      case 'ArrowUp': {
        // TODO
        event.preventDefault();
        this.historySearchUp();
        break;
      }
      case 'ArrowDown': {
        // TODO
        event.preventDefault();
        this.historySearchDown();
        break;
      }
      // avoid backspace when just after the prompt the user press bs
      case 'ArrowLeft':
      case 'Backspace': {
        // block cursor when moving left in the prompt prefix
        {
          // const inputEl = event.target as HTMLInputElement;
          // inputEl.focus();
          const { selectionStart } = this.inputRef;
          if (this.isCursorOnPrompt(selectionStart)) {
            event.preventDefault();
          }
        }
        break;
      }
      // // avoid backspace when just after the prompt the user press bs
      // case 'Backspace': {
      //   {
      //     const { selectionStart } = this.inputRef;
      //     if (this.isCursorOnPrompt(selectionStart)) {
      //       event.preventDefault();
      //     }
      //   }
      //   break;
      // }
      case 'Control': {
        this.ctrlDown = true;
        break;
      }
      case 'a': {
        // C-a should go after the prompt prefix...
        if (this.ctrlDown) {
          event.preventDefault();
          const inputEl = this.inputRef;
          const { prompt } = this.props;
          inputEl.setSelectionRange(prompt.length, prompt.length);
        }
        break;
      }
      case 'u': {
        // C-u delete text before the cursor (prompt excluded)
        if (this.ctrlDown) {
          event.preventDefault();
          const inputEl = this.inputRef;
          const { selectionStart } = inputEl;
          const { prompt } = this.props;
          inputEl.value =
            prompt +
            (selectionStart === null
              ? ''
              : inputEl.value.slice(Math.max(0, selectionStart)));
          // force cursor position after the prompt
          inputEl.setSelectionRange(prompt.length, prompt.length);
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  private onInputKeyUp(
    event: JSX.TargetedKeyboardEvent<HTMLInputElement>,
  ): void {
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (event.key) {
      case 'Control': {
        this.ctrlDown = false;
        break;
      }
      default: {
        break;
      }
    }
  }

  private onInputKeyChange(event: React.ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    const inputEl = this.inputRef; // event.target as HTMLInputElement;
    const { prompt } = this.props;
    const input = inputEl.value;
    const line = this.props.prompt + input.slice(prompt.length);
    assert(
      this.histSearchIdx >= 0 && this.histSearchIdx < this.histLines.length,
    );
    this.histLines[this.histSearchIdx] = line;
    inputEl.value = line;
  }

  private onInputClick(event: React.ChangeEvent<HTMLInputElement>): void {
    // if the user clicks on prompt string reset cursor pos...
    event.preventDefault();
    const inputEl = this.inputRef; // event.target as HTMLInputElement;
    const { prompt } = this.props;
    const { selectionStart: pos } = inputEl;
    if (pos === 0 || (pos && pos < prompt.length)) {
      const tpos = inputEl.value.length; // ...to the end of the input
      inputEl.setSelectionRange(tpos, tpos);
    }
  }

  // TODO
  private historySearchUp(): void {
    this.historySearch(-1);
  }

  private historySearchDown(): void {
    this.historySearch(1);
  }

  private historySearch(direction: number): void {
    // console.log('historySearch: ', direction, this.histSearchIdx, this.histLines);
    assert(direction === 1 || direction === -1);
    const numLines = this.histLines.length;
    if (numLines) {
      assert(this.histSearchIdx >= 0 && this.histSearchIdx < numLines);
      this.histSearchIdx =
        (this.histSearchIdx + direction + numLines) % numLines;
      this.inputRef.value = this.histLines[this.histSearchIdx]!;
    }
  }

  // called when the label is opening/closing.
  // This executes after the transition, to start see setOpen
  private onTransitionEnd(): void {
    if (this.state.open) {
      this.inputRef.focus();
      this.props.onOpened();
    } else {
      this.isClosed = true;
      this.props.onClosed();
      // this.mainEl!.style.visibility = 'hidden'; // TODO: necessary?
    }
  }

  // render(props: ConsolePanelProps, state: ConsolePanelState) {
  render(): JSX.Element {
    const lineHeightStyle = `${this.props.lineHeight}px`;
    const fontSizeStyle = `${this.props.fontSize}px`;

    const labelHeight =
      this.props.percHeight * this.props.container.clientHeight;

    const labelStyle = ConsolePanel.buildLabelStyleObj(
      this.isClosed,
      this.props,
      this.state,
      `${labelHeight}px`,
      lineHeightStyle,
      fontSizeStyle,
    );

    const inputStyle = ConsolePanel.buildInputStyle(
      lineHeightStyle,
      fontSizeStyle,
    ) as React.CSSProperties;

    const historyStyle = ConsolePanel.buildHistoryStyle(
      labelHeight,
      this.props.lineHeight,
    );

    return (
      <label
        className="console-label"
        style={labelStyle}
        onTransitionEnd={this.onTransitionEnd.bind(this)}
        ref={(e) => {
          this.mainEl = e;
        }}
      >
        <div
          className="console-history"
          style={historyStyle}
          ref={(e) => {
            this.listContRef = e!;
          }}
        >
          <ConsoleHistoryPanel
            stmts={this.props.history}
            getPanelRef={() => this.listContRef}
            autoScrollNewItems={this.state.autoScrollNewItems}
            scrollTopTo={this.state.forceScrollTo}
          />
        </div>

        <input
          spellcheck={false}
          className="console-input"
          style={inputStyle}
          ref={(el) => {
            this.inputRef = el!;
          }}
          // defaultValue={this.props.prompt}
          onFocus={this.onInputFocus.bind(this)}
          onChange={this.onInputKeyChange.bind(this)}
          onClick={this.onInputClick.bind(this)}
          onKeyDown={this.onInputKeyDown.bind(this)}
          onKeyUp={this.onInputKeyUp.bind(this)}
        />
      </label>
    );
  }

  private static buildLabelStyleObj(
    isClosed: boolean,
    _props: ConsolePanelProps,
    state: ConsolePanelState,
    height: string,
    lineHeight: string,
    fontSize: string,
  ): React.CSSProperties {
    // update the transition property
    const marginTop = state.open ? '0' : `-${height}`;
    const visibility = isClosed ? 'hidden' : 'visible';

    const labelStyle = {
      visibility,
      height,
      fontSize,
      lineHeight,
      // comment this below to have a transition effect when closing
      // Visibility is handled below and in handleTransitionEnd
      // because we want the comp to be immediately visible when opening and
      // to become hidden only after transition when closing
      // visibility: state.visible ? 'visible' : 'hidden', // not used here
      marginTop,
      // zIndex: Number(props.container.style.zIndex) + 1,
    };

    return labelStyle;
  }

  private static buildHistoryStyle(
    labelHeight: number,
    lineHeight: number,
  ): React.CSSProperties {
    const inputVertPadding =
      ConsolePanel.INPUT_PADDING_TOP + ConsolePanel.INPUT_PADDING_BOTTOM;
    const inputHeightDec = (lineHeight + inputVertPadding) / labelHeight;
    const histHeightPerc = 100 * (1 - inputHeightDec);

    const historyStyle = {
      height: `${Math.round(histHeightPerc)}%`,
    };

    return historyStyle;
  }

  private static buildInputStyle(
    lineHeight: string,
    fontSize: string,
  ): React.CSSProperties {
    const inputStyle = {
      fontSize,
      lineHeight,
      height: lineHeight, // use the same
      paddingTop: `${ConsolePanel.INPUT_PADDING_TOP}px`,
      paddingBottom: `${ConsolePanel.INPUT_PADDING_BOTTOM}px`,
    };

    return inputStyle;
  }
}

export { ConsolePanel };
export type { ConsolePanelProps, OnConsoleEventHandler };
