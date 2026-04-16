import { Component, ElementRef, Renderer2, RendererStyleFlags2, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, NavbarComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent {

  form: FormGroup;
  robotChecked = false;
  submitting = false;
  submitSuccess = false;
  submitError = false;

  @ViewChild('messageBox') messageBox?: ElementRef<HTMLDivElement>;
  private dragStartY = 0;
  private dragStartHeight = 0;
  private dragging = false;
  private readonly minHeight = 96;
  private readonly maxHeight = 600;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private renderer: Renderer2
  ) {
    this.form = this.fb.group({
      firstName:    ['', Validators.required],
      lastName:     ['', Validators.required],
      email:        ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required, Validators.email]],
      message:      ['']
    }, { validators: this.emailsMatch });
  }

  private emailsMatch(group: AbstractControl) {
    const email        = group.get('email')?.value;
    const confirmEmail = group.get('confirmEmail')?.value;
    return email === confirmEmail ? null : { emailMismatch: true };
  }

  get canSubmit(): boolean {
    return this.form.valid && this.robotChecked && !this.submitting;
  }

  onDragStart(e: PointerEvent): void {
    if (!this.messageBox) return;
    e.preventDefault();
    this.dragging = true;
    this.dragStartY = e.clientY;
    this.dragStartHeight = this.messageBox.nativeElement.offsetHeight;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  onDragMove(e: PointerEvent): void {
    if (!this.dragging || !this.messageBox) return;
    const delta = e.clientY - this.dragStartY;
    const newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, this.dragStartHeight + delta));
    const el = this.messageBox.nativeElement;
    this.renderer.setStyle(el, 'height', `${newHeight}px`, RendererStyleFlags2.Important);
    this.renderer.setStyle(el, 'min-height', `${newHeight}px`, RendererStyleFlags2.Important);
  }

  onDragEnd(): void {
    this.dragging = false;
  }

  onSubmit(): void {
    if (!this.canSubmit) return;

    this.submitting = true;
    this.submitSuccess = false;
    this.submitError = false;

    const { firstName, lastName, email, message } = this.form.value;

    this.contactService.submit({ firstName, lastName, email, message }).subscribe({
      next: () => {
        this.submitSuccess = true;
        this.submitting = false;
        this.form.reset();
        this.robotChecked = false;
      },
      error: () => {
        this.submitError = true;
        this.submitting = false;
      }
    });
  }
}
