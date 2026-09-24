import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Link, LinkService } from './link.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly linkService = inject(LinkService);

  readonly links = signal<Link[]>([]);
  readonly url = signal('');
  readonly createdLink = signal<Link | null>(null);
  readonly error = signal('');
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadLinks();
  }

  submit(): void {
    const value = this.url().trim();
    if (!this.isHttpUrl(value)) {
      this.error.set('Enter a valid http:// or https:// URL.');
      this.createdLink.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.createdLink.set(null);
    this.linkService.createLink(value).subscribe({
      next: (link) => {
        this.links.update((links) => [link, ...links]);
        this.createdLink.set(link);
        this.url.set('');
        this.loading.set(false);
      },
      error: (response) => {
        this.error.set(response.error?.error ?? 'Could not create the short link.');
        this.loading.set(false);
      },
    });
  }

  private loadLinks(): void {
    this.linkService.getLinks().subscribe({
      next: (links) => this.links.set(links),
      error: () => this.error.set('Could not connect to the Snip backend.'),
    });
  }

  private isHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
