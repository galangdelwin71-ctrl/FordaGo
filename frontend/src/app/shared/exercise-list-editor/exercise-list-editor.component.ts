// exercise-list-editor.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { NoNegativeDirective } from '../../directives/no-negative.directive';

/**
 * Deliberately decoupled from schedule.page.ts's own `Exercise` interface
 * (name/sets:number/reps:string/done?) rather than importing it — this is
 * a shared/ component, so it must not depend on a feature page's types.
 * The shape below is structurally identical to schedule.page.ts's
 * `Exercise`, so passing `Exercise[]` in from that page (or any other
 * page with the same shape) just works via TypeScript structural typing;
 * no cast is needed on either side.
 */
export interface EditableExercise {
  name: string;
  sets: number;
  reps: string;
  done?: boolean;
}

/**
 * Reusable add/edit/remove row list for a set of exercises. Consolidates
 * what used to be 3 near-identical copies of this UI across schedule.page
 * (session edit panel, Add Workout modal, Week Plan day editor) into one
 * component with a single implementation of the add/remove/edit logic.
 *
 * Usage: <app-exercise-list-editor [(exercises)]="someExerciseArray" />
 *
 * State ownership: `exercises` flows in as an @Input and every mutation
 * (add/remove/edit) builds a NEW array and emits it via `exercisesChange`
 * rather than mutating the input array in place. This keeps the parent's
 * bound property as the single source of truth and avoids the classic bug
 * class of a child silently mutating a parent's array behind its back —
 * safe under both default and OnPush change detection.
 */
@Component({
  selector: 'app-exercise-list-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, NoNegativeDirective],
  templateUrl: './exercise-list-editor.component.html',
  styleUrls: ['./exercise-list-editor.component.scss'],
})
export class ExerciseListEditorComponent {
  @Input() exercises: EditableExercise[] = [];
  @Output() exercisesChange = new EventEmitter<EditableExercise[]>();

  /** Section heading shown above the rows (e.g. "Exercises", "My Exercises"). */
  @Input() title = 'Exercises';
  /** Label on the add-row button. */
  @Input() addButtonLabel = 'Add';
  /** Hint text shown only when the list is empty. */
  @Input() emptyHint = 'No exercises added yet';
  /**
   * Minimum number of rows that must always remain — the per-row remove
   * button is hidden once the list is at (or below) this size. Defaults to
   * 0 so every row is removable, matching the prior per-page behavior.
   */
  @Input() minItems = 0;

  trackByIndex(index: number): number {
    return index;
  }

  addExercise(): void {
    const next: EditableExercise[] = [...this.exercises, { name: '', sets: 3, reps: '10' }];
    this.exercises = next;
    this.exercisesChange.emit(next);
  }

  removeExercise(index: number): void {
    if (this.exercises.length <= this.minItems) return;
    if (index < 0 || index >= this.exercises.length) return;
    const next = this.exercises.filter((_, i) => i !== index);
    this.exercises = next;
    this.exercisesChange.emit(next);
  }

  /**
   * Applies a single-field edit to the row at `index` and re-emits. Reads
   * as `updateExercise(i, { name: $event })` etc. from the template so
   * each input's (ngModelChange) only ever touches its own field.
   */
  updateExercise(index: number, patch: Partial<EditableExercise>): void {
    if (index < 0 || index >= this.exercises.length) return;
    const next = this.exercises.map((ex, i) => (i === index ? { ...ex, ...patch } : ex));
    this.exercises = next;
    this.exercisesChange.emit(next);
  }
}
