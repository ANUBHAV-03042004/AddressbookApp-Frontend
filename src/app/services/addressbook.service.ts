import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AddressBook, Contact, ContactDTO, ApiResponse, ContactCountMap } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AddressbookService {
 private api = '/api';

  constructor(private http: HttpClient) {}

  private extract<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
    return obs.pipe(map(r => r.data));
  }

  // ── Address Book APIs ──────────────────────────────────────────────────

  /** GET /api/addressbooks — Get all address books */
  getBooks(): Observable<AddressBook[]> {
    return this.extract(this.http.get<ApiResponse<AddressBook[]>>(`${this.api}/addressbooks`));
  }

  /** POST /api/addressbooks — Create a new address book */
  createBook(name: string): Observable<AddressBook> {
    return this.extract(
      this.http.post<ApiResponse<AddressBook>>(`${this.api}/addressbooks?name=${encodeURIComponent(name)}`, {})
    );
  }

  /** GET /api/addressbooks/{id} — Get address book by ID */
  getBook(id: number): Observable<AddressBook> {
    return this.extract(this.http.get<ApiResponse<AddressBook>>(`${this.api}/addressbooks/${id}`));
  }

  /** DELETE /api/addressbooks/{id} — Delete an address book */
  deleteBook(id: number): Observable<any> {
    return this.extract(this.http.delete<ApiResponse<any>>(`${this.api}/addressbooks/${id}`));
  }

  // ── Contact APIs ───────────────────────────────────────────────────────

  /** GET /api/addressbooks/{bookId}/contacts — Get all contacts */
  /** GET /api/addressbooks/{bookId}/contacts/sorted/name — Sort by name */
  /** GET /api/addressbooks/{bookId}/contacts/sorted/location — Sort by location */
  getContacts(bookId: number, sort?: 'name' | 'location'): Observable<ContactDTO[]> {
    let path = `/addressbooks/${bookId}/contacts`;
    if (sort === 'name')     path += '/sorted/name';
    else if (sort === 'location') path += '/sorted/location';
    return this.extract(this.http.get<ApiResponse<ContactDTO[]>>(`${this.api}${path}`));
  }

  /** POST /api/addressbooks/{bookId}/contacts — Add a contact */
  addContact(bookId: number, contact: ContactDTO): Observable<ContactDTO> {
    return this.extract(
      this.http.post<ApiResponse<ContactDTO>>(`${this.api}/addressbooks/${bookId}/contacts`, contact)
    );
  }

  /** PUT /api/addressbooks/{bookId}/contacts/{firstName}/{lastName} — Edit a contact */
  updateContact(bookId: number, firstName: string, lastName: string, contact: ContactDTO): Observable<ContactDTO> {
    return this.extract(
      this.http.put<ApiResponse<ContactDTO>>(
        `${this.api}/addressbooks/${bookId}/contacts/${encodeURIComponent(firstName)}/${encodeURIComponent(lastName)}`,
        contact
      )
    );
  }

  /** DELETE /api/addressbooks/{bookId}/contacts/{firstName}/{lastName} — Delete a contact */
  deleteContact(bookId: number, firstName: string, lastName: string): Observable<any> {
    return this.extract(
      this.http.delete<ApiResponse<any>>(
        `${this.api}/addressbooks/${bookId}/contacts/${encodeURIComponent(firstName)}/${encodeURIComponent(lastName)}`
      )
    );
  }

  /** GET /api/addressbooks/contacts/{contactId} — Get contact by ID */
  getContactById(contactId: number): Observable<ContactDTO> {
    return this.extract(
      this.http.get<ApiResponse<ContactDTO>>(`${this.api}/addressbooks/contacts/${contactId}`)
    );
  }

  /** GET /api/addressbooks/contacts/state/{state} — Get contacts by state */
  getContactsByState(state: string): Observable<ContactDTO[]> {
    return this.extract(
      this.http.get<ApiResponse<ContactDTO[]>>(`${this.api}/addressbooks/contacts/state/${encodeURIComponent(state)}`)
    );
  }

  /** GET /api/addressbooks/contacts/city/{city} — Get contacts by city */
  getContactsByCity(city: string): Observable<ContactDTO[]> {
    return this.extract(
      this.http.get<ApiResponse<ContactDTO[]>>(`${this.api}/addressbooks/contacts/city/${encodeURIComponent(city)}`)
    );
  }

  /** GET /api/addressbooks/contacts/search?name=... — Search contacts by name */
  searchContacts(name: string): Observable<ContactDTO[]> {
    const params = new HttpParams().set('name', name);
    return this.extract(
      this.http.get<ApiResponse<ContactDTO[]>>(`${this.api}/addressbooks/contacts/search`, { params })
    );
  }

  /** GET /api/addressbooks/contacts/count?city=...&state=... — Count contacts by city or state */
  countContacts(filter: { city?: string; state?: string }): Observable<ContactCountMap> {
    let params = new HttpParams();
    if (filter.city)  params = params.set('city',  filter.city);
    if (filter.state) params = params.set('state', filter.state);
    return this.extract(
      this.http.get<ApiResponse<ContactCountMap>>(`${this.api}/addressbooks/contacts/count`, { params })
    );
  }
}
