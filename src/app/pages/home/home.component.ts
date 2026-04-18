import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AddressbookService } from '../../services/addressbook.service';
import { AuthService } from '../../services/auth.service';
import { AddressBook, ContactDTO, ContactCountMap } from '../../models/models';

type Panel = 'contacts' | 'search' | 'filter' | 'count';
type FilterType = 'city' | 'state';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  // Address books
  books: AddressBook[] = [];
  activeBook: AddressBook | null = null;

  // Contacts
  contacts: ContactDTO[] = [];
  filteredContacts: ContactDTO[] = [];

  // UI state
  newBookName = '';
  searchQuery = '';
  sortOrder: 'default' | 'name' | 'location' = 'default';
  showModal = false;
  editingContact: ContactDTO | null = null;
  form: Partial<ContactDTO> = {};
  toast = { show: false, msg: '', type: 'success' };
  private toastTimer: any;

  // Panel (contacts / global search / filter by city-state / count)
  activePanel: Panel = 'contacts';

  // Global search
  globalSearchQuery = '';
  globalSearchResults: ContactDTO[] = [];
  globalSearchLoading = false;

  // Filter panel
  filterType: FilterType = 'city';
  filterValue = '';
  filterResults: ContactDTO[] = [];
  filterLoading = false;

  // Count panel
  countFilterType: FilterType = 'city';
  countFilterValue = '';
  countResults: ContactCountMap = {};
  countLoading = false;

  // Navbar
  showUserMenu = false;
  get username(): string { return this.auth.getUsername() || 'User'; }

  // Animated bubbles
  bubbles = Array.from({ length: 14 }, () => {
    const size = 20 + Math.random() * 60;
    return {
      width: size + 'px', height: size + 'px',
      left: Math.random() * 100 + '%',
      animationDuration: (8 + Math.random() * 14) + 's',
      animationDelay: Math.random() * 12 + 's'
    };
  });

  readonly COLORS = ['#1565C0','#E53935','#FF7043','#2E7D32','#6A1B9A','#AD1457','#00838F','#F57F17'];
  readonly EMOJIS = ['📒','📗','📘','📙','📕','📓','📔','📃'];

  constructor(
    private svc: AddressbookService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() { this.loadBooks(); }

  // ── Helpers ──────────────────────────────────────────────────────────────
  hashStr(s: string) { let h = 0; for (const c of s) h += c.charCodeAt(0); return h; }
  getColor(fn: string, ln: string) { return this.COLORS[this.hashStr((fn||'')+(ln||'')) % this.COLORS.length]; }
  getInitials(fn: string, ln: string) { return ((fn||'')[0]||'').toUpperCase()+((ln||'')[0]||'').toUpperCase(); }
  getEmoji(name: string) { return this.EMOJIS[this.hashStr(name||'') % this.EMOJIS.length]; }

  showToast(msg: string, type: 'success'|'error' = 'success') {
    clearTimeout(this.toastTimer);
    this.toast = { show: true, msg: (type==='success'?'✅ ':'❌ ')+msg, type };
    this.toastTimer = setTimeout(() => this.toast.show = false, 2800);
  }

  get countResultEntries(): { key: string; value: number }[] {
    return Object.entries(this.countResults).map(([key, value]) => ({ key, value }));
  }

  // ── Books ─────────────────────────────────────────────────────────────────
  loadBooks() {
    this.svc.getBooks().subscribe({
      next: books => { this.books = books || []; this.loadCounts(); },
      error: (e: any) => {
        if (e?.status === 401 || e?.status === 403) {
          // interceptor will call logout(); no need to show toast
        } else {
          const msg = e?.error?.message || e?.message || 'Network error';
          this.showToast('Failed to load books: ' + msg, 'error');
        }
      }
    });
  }

  loadCounts() {
    this.books.forEach(b => {
      this.svc.getContacts(b.id).subscribe({
        next: cs => b.contactCount = (cs||[]).length,
        error: () => {}
      });
    });
  }

  createBook() {
    if (!this.newBookName.trim()) { this.showToast('Enter a book name!', 'error'); return; }
    this.svc.createBook(this.newBookName.trim()).subscribe({
      next: book => {
        this.books.push({ ...book, contactCount: 0 });
        this.newBookName = '';
        this.showToast(`"${book.name}" created!`);
      },
      error: (e: any) => this.showToast(e?.error?.message || 'Error creating book', 'error')
    });
  }

  deleteBook(book: AddressBook) {
    if (!confirm(`Delete "${book.name}" and all its contacts?`)) return;
    this.svc.deleteBook(book.id).subscribe({
      next: () => {
        this.books = this.books.filter(b => b.id !== book.id);
        if (this.activeBook?.id === book.id) { this.activeBook = null; this.contacts = []; this.filteredContacts = []; }
        this.showToast(`"${book.name}" deleted`);
      },
      error: (e: any) => this.showToast(e?.error?.message || 'Error deleting book', 'error')
    });
  }

  selectBook(book: AddressBook) {
    this.activeBook = book;
    this.searchQuery = '';
    this.sortOrder = 'default';
    this.activePanel = 'contacts';
    this.loadContacts();
  }

  // ── Contacts ──────────────────────────────────────────────────────────────
  loadContacts() {
    if (!this.activeBook) return;
    const sort = this.sortOrder === 'default' ? undefined : this.sortOrder;
    this.svc.getContacts(this.activeBook.id, sort).subscribe({
      next: cs => {
        this.contacts = cs || [];
        this.filterContacts();
        if (this.activeBook) this.activeBook.contactCount = this.contacts.length;
      },
      error: (e: any) => this.showToast(e?.error?.message || 'Error loading contacts', 'error')
    });
  }

  filterContacts() {
    const q = this.searchQuery.toLowerCase();
    this.filteredContacts = q
      ? this.contacts.filter(c =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          (c.city||'').toLowerCase().includes(q) ||
          (c.email||'').toLowerCase().includes(q))
      : [...this.contacts];
  }

  get uniqueCities(): string[] {
    return [...new Set(this.filteredContacts.map(c => c.city).filter(Boolean) as string[])];
  }

  openAdd() { this.editingContact = null; this.form = {}; this.showModal = true; }
  openEdit(c: ContactDTO) { this.editingContact = c; this.form = {...c}; this.showModal = true; }
  closeModal() { this.showModal = false; }

  saveContact() {
    if (!this.form.firstName||!this.form.lastName||!this.form.address||!this.form.city||!this.form.state) {
      this.showToast('Fill all required (*) fields!', 'error'); return;
    }
    if (!this.activeBook) return;
    const dto = this.form as ContactDTO;
    if (this.editingContact) {
      this.svc.updateContact(this.activeBook.id, this.editingContact.firstName, this.editingContact.lastName, dto)
        .subscribe({
          next: () => { this.showToast('Contact updated!'); this.closeModal(); this.loadContacts(); },
          error: (e: any) => this.showToast(e?.error?.message||'Error updating','error')
        });
    } else {
      this.svc.addContact(this.activeBook.id, dto).subscribe({
        next: () => { this.showToast('Contact added! 🎉'); this.closeModal(); this.loadContacts(); },
        error: (e: any) => this.showToast(e?.error?.message||'Error adding','error')
      });
    }
  }

  deleteContact(c: ContactDTO) {
    if (!this.activeBook) return;
    if (!confirm(`Delete ${c.firstName} ${c.lastName}?`)) return;
    this.svc.deleteContact(this.activeBook.id, c.firstName, c.lastName).subscribe({
      next: () => { this.showToast('Contact deleted'); this.loadContacts(); },
      error: (e: any) => this.showToast(e?.error?.message||'Error deleting','error')
    });
  }

  formatLocation(c: ContactDTO): string {
    const parts = [c.city, c.state].filter(v => !!v);
    const loc = parts.join(', ');
    return c.zip ? loc + ' – ' + c.zip : loc;
  }

  // ── Global Search (GET /api/addressbooks/contacts/search) ─────────────────
  setPanel(p: Panel) {
    this.activePanel = p;
    if (p !== 'contacts' && this.activeBook) {
      // keep book selected but switch view
    }
  }

  runGlobalSearch() {
    const q = this.globalSearchQuery.trim();
    if (!q) { this.showToast('Enter a name to search', 'error'); return; }
    this.globalSearchLoading = true;
    this.globalSearchResults = [];
    this.svc.searchContacts(q).subscribe({
      next: res => { this.globalSearchResults = res || []; this.globalSearchLoading = false; },
      error: (e: any) => { this.showToast(e?.error?.message||'Search failed','error'); this.globalSearchLoading = false; }
    });
  }

  // ── Filter by City / State ─────────────────────────────────────────────────
  runFilter() {
    const v = this.filterValue.trim();
    if (!v) { this.showToast('Enter a value to filter', 'error'); return; }
    this.filterLoading = true;
    this.filterResults = [];
    const obs = this.filterType === 'city'
      ? this.svc.getContactsByCity(v)
      : this.svc.getContactsByState(v);
    obs.subscribe({
      next: res => { this.filterResults = res || []; this.filterLoading = false; },
      error: (e: any) => { this.showToast(e?.error?.message||'Filter failed','error'); this.filterLoading = false; }
    });
  }

  // ── Count contacts ─────────────────────────────────────────────────────────
  runCount() {
    const v = this.countFilterValue.trim();
    if (!v) { this.showToast('Enter a value to count', 'error'); return; }
    this.countLoading = true;
    this.countResults = {};
    const filter = this.countFilterType === 'city' ? { city: v } : { state: v };
    this.svc.countContacts(filter).subscribe({
      next: res => { this.countResults = res || {}; this.countLoading = false; },
      error: (e: any) => { this.showToast(e?.error?.message||'Count failed','error'); this.countLoading = false; }
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  logout() { this.auth.logout(); }
  toggleUserMenu() { this.showUserMenu = !this.showUserMenu; }

  @HostListener('document:keydown.escape')
  onEsc() { this.showModal = false; this.showUserMenu = false; }
}
