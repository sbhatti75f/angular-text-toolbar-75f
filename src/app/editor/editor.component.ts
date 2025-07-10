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

  showTextEditor = false;
  @ViewChild('contextMenu') contextMenu!: ElementRef;
  
  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.setupContextMenu();
  }

  addText(): void {
    this.showTextEditor = true;
    this.contextMenu.nativeElement.classList.add('hidden');
  }

  addImage(): void {
    alert('Mock: Add Image Clicked');
    this.contextMenu.nativeElement.classList.add('hidden');
  }

  onDiscardText(): void {
    this.showTextEditor = false; 
  }

  private setupContextMenu(): void {
    this.renderer.listen('document', 'contextmenu', (e: MouseEvent) => {
      // Only show context menu for clicks outside editable areas
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
}
