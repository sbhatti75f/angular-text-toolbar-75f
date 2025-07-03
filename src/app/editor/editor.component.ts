import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements AfterViewInit {

  @ViewChild('contextMenu') contextMenu!: ElementRef;
  @ViewChild('editorWrapper') editorWrapper!: ElementRef;
  @ViewChild('textAreaContainer') container!: ElementRef;
  @ViewChild('editableDiv') editableDiv!: ElementRef;
  @ViewChild('resizer') resizer!: ElementRef;
  @ViewChild('actionBar') actionBar!: ElementRef; 

  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private readonly STORAGE_KEY = 'editor_saved_data';

  isBoldActive = false;
  isItalicActive = false;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.setupContextMenu();
    this.setupResizable();
    this.setupDropdowns();
    this.setupStyleButtons();
    this.setupDeleteHandler();
    this.setupBlurCleaner();
  }

  private setupContextMenu(): void {
    this.renderer.listen('document', 'contextmenu', (e: MouseEvent) => {
      // Check if click is inside action bar or text area container
      const actionBar = this.actionBar?.nativeElement;
      const textAreaContainer = this.container?.nativeElement;
      
      if (actionBar && actionBar.contains(e.target)) {
        e.preventDefault();
        return;
      }
      
      if (textAreaContainer && textAreaContainer.contains(e.target)) {
        e.preventDefault();
        return;
      }

      // Only show context menu for clicks outside restricted areas
      e.preventDefault();
      const menu = this.contextMenu.nativeElement;
      menu.style.top = `${e.clientY}px`;
      menu.style.left = `${e.clientX}px`;
      menu.classList.remove('hidden');
    });

    this.renderer.listen('document', 'click', () => {
      this.contextMenu.nativeElement.classList.add('hidden');
    });
  }

  addText(): void {
    this.editorWrapper.nativeElement.classList.remove('hidden');
    this.contextMenu.nativeElement.classList.add('hidden');
  }

  addImage(): void {
    alert('Mock: Add Image Clicked');
    this.contextMenu.nativeElement.classList.add('hidden');
  }

  saveChanges(): void {
    const editorData = {
      content: this.editableDiv.nativeElement.innerHTML,
      styles: {
        fontSize: this.editableDiv.nativeElement.style.fontSize,
        fontWeight: this.editableDiv.nativeElement.style.fontWeight,
        fontStyle: this.editableDiv.nativeElement.style.fontStyle,
        textAlign: this.editableDiv.nativeElement.style.textAlign,
        verticalAlign: this.editableDiv.nativeElement.style.verticalAlign
      },
      dimensions: {
        width: this.container.nativeElement.style.width,
        height: this.container.nativeElement.style.height
      }
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(editorData));
    alert('Editor content saved to local storage!');
  }

  discardChanges(): void {
    if (confirm('Are you sure you want to discard all changes?')) {
      localStorage.removeItem(this.STORAGE_KEY);
      this.editableDiv.nativeElement.innerHTML = '';
      this.editorWrapper.nativeElement.classList.add('hidden');
      alert('Changes discarded and editor cleared.');
    }
  }

  // Resizer Logic
  private setupResizable(): void {
    const container = this.container.nativeElement;
    const resizer = this.resizer.nativeElement;

    this.renderer.listen(resizer, 'mousedown', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.isResizing = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startWidth = container.offsetWidth;
      this.startHeight = container.offsetHeight;
      container.style.zIndex = '1000';
    });

    this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      if (this.isResizing) {
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        container.style.width = Math.max(119, Math.min(this.startWidth + dx, 1200)) + 'px';
        container.style.height = Math.max(22, this.startHeight + dy) + 'px';
      }
    });

    this.renderer.listen('document', 'mouseup', () => {
      this.isResizing = false;
    });
  }

  // Text style buttons (bold/italic)
  private setupStyleButtons(): void {
    const editable = this.editableDiv.nativeElement;

    const boldButton = document.querySelector('.bold') as HTMLElement;
    const italicButton = document.querySelector('.italic') as HTMLElement;

    if (boldButton) {
      this.renderer.listen(boldButton, 'click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.applyTextStyle('fontWeight', this.isBoldActive ? 'normal' : 'bold');
        this.isBoldActive = !this.isBoldActive;
        boldButton.classList.toggle('active', this.isBoldActive);
      });
    }

    if (italicButton) {
      this.renderer.listen(italicButton, 'click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.applyTextStyle('fontStyle', this.isItalicActive ? 'normal' : 'italic');
        this.isItalicActive = !this.isItalicActive;
        italicButton.classList.toggle('active', this.isItalicActive);
      });
    }
  }

  private applyTextStyle(styleProperty: string, styleValue: string): void {
    const editable = this.editableDiv.nativeElement;
    editable.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      const command = styleProperty === 'fontWeight' ? 'bold' : 'italic';
      document.execCommand(command, false, undefined);
      return;
    }

    const range = selection.getRangeAt(0);
    if (selection.isCollapsed) {
      const command = styleProperty === 'fontWeight' ? 'bold' : 'italic';
      document.execCommand(command, false, undefined);
    } else {
      const selectedContent = range.extractContents();
      const wrapper = document.createElement('span');
      (wrapper.style as any)[styleProperty] = styleValue;
      wrapper.appendChild(selectedContent);
      range.insertNode(wrapper);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  // Dropdowns (text size, alignment)
  private setupDropdowns(): void {
    // Text size
    const textSizeControl = document.querySelector('.text-size') as HTMLElement;
    const currentTextSize = textSizeControl?.querySelector('.svg-default');

    this.renderer.listen(textSizeControl, 'click', (e: Event) => {
      e.stopPropagation();
      textSizeControl.classList.toggle('active');
    });

    this.renderer.listen('document', 'click', () => {
      textSizeControl?.classList.remove('active');
    });

    document.querySelectorAll('.size-option').forEach(option => {
      this.renderer.listen(option, 'click', (e: Event) => {
        e.stopPropagation();
        const size = option.getAttribute('data-size');
        const sizes: any = {
          small: '10px',
          medium: '14px',
          large: '18px'
        };
        const template = option.querySelector('.replacement-icon');
        if (template && currentTextSize) {
          currentTextSize.innerHTML = template.innerHTML;
        }
        if (this.editableDiv?.nativeElement) {
          this.editableDiv.nativeElement.style.fontSize = sizes[size || 'medium'];
        }
        textSizeControl.classList.remove('active');
      });
    });

    // Horizontal alignment
    const alignmentControl = document.querySelector('.alignment') as HTMLElement;
    const currentAlignIcon = alignmentControl?.querySelector('.svg-default');
    const alignOptions = document.querySelectorAll('.align-option');

    if (alignmentControl) {
      this.renderer.listen(alignmentControl, 'click', (e: Event) => {
        e.stopPropagation();
        alignmentControl.classList.toggle('active');
      });

      this.renderer.listen('document', 'click', () => {
        alignmentControl?.classList.remove('active');
      });

      alignOptions.forEach(option => {
        this.renderer.listen(option, 'click', (e: Event) => {
          e.stopPropagation();
          const alignType = option.getAttribute('data-align');
          const replacement = option.querySelector('.replacement-icon');
          if (replacement && currentAlignIcon) {
            currentAlignIcon.innerHTML = replacement.innerHTML;
          }
          if (this.editableDiv?.nativeElement && alignType) {
            this.editableDiv.nativeElement.style.textAlign = alignType;
          }
          alignmentControl.classList.remove('active');
        });
      });
    }

    // Vertical alignment
    const vAlignControl = document.querySelector('.vertical-alignment') as HTMLElement;
    const currentVAlignIcon = vAlignControl?.querySelector('.svg-default');
    const vAlignOptions = document.querySelectorAll('.v-align-option');

    if (vAlignControl) {
      this.renderer.listen(vAlignControl, 'click', (e: Event) => {
        e.stopPropagation();
        vAlignControl.classList.toggle('active');
      });

      this.renderer.listen('document', 'click', () => {
        vAlignControl?.classList.remove('active');
      });

      vAlignOptions.forEach(option => {
        this.renderer.listen(option, 'click', (e: Event) => {
          e.stopPropagation();
          const valignType = option.getAttribute('data-valign');
          const replacement = option.querySelector('.replacement-icon');
          if (replacement && currentVAlignIcon) {
            currentVAlignIcon.innerHTML = replacement.innerHTML;
          }
          if (this.editableDiv?.nativeElement && valignType) {
            this.editableDiv.nativeElement.style.verticalAlign = valignType;
          }
          vAlignControl.classList.remove('active');
        });
      });
    }
  }

  // Delete Button
  private setupDeleteHandler(): void {
    const deleteButton = document.querySelector('.deleting');
    this.renderer.listen(deleteButton, 'click', () => {
      this.editableDiv.nativeElement.innerHTML = '';
    });
  }

  // Clean up empty spans
  private setupBlurCleaner(): void {
    this.renderer.listen(this.editableDiv.nativeElement, 'blur', () => {
      const spans = this.editableDiv.nativeElement.querySelectorAll('span');
      spans.forEach((span: HTMLElement) => {
        if (!span.innerHTML.trim() || span.textContent === '\u200B') {
          span.remove();
        }
      });
    });
  }
}