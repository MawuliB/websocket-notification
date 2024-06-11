import { TestBed } from '@angular/core/testing';

import { MyStompService } from './my-stomp.service';

describe('MyStompService', () => {
  let service: MyStompService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyStompService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
