import { describe, expect, it } from 'vitest';

import RoleClassifier from '../src/analysis/role.classifier.js';
import GitHubUrlUtil from '../src/utils/github-url.util.js';

describe('RoleClassifier', () => {
  it('classifies common backend files deterministically', () => {
    const classifier = new RoleClassifier();
    expect(classifier.classify('src/auth/auth.controller.ts')).toBe('controller');
    expect(classifier.classify('src/project.service.ts')).toBe('service');
    expect(classifier.classify('src/user.repository.ts')).toBe('repository');
    expect(classifier.classify('src/user.model.ts')).toBe('model');
    expect(classifier.classify('src/routes/project.routes.ts')).toBe('entry');
    expect(classifier.classify('src/misc.ts')).toBe('unknown');
  });
});

describe('GitHubUrlUtil', () => {
  it('accepts only canonical public GitHub repository URLs', () => {
    expect(new GitHubUrlUtil().parse('https://github.com/openai/example')).toEqual({
      owner: 'openai',
      repository: 'example',
    });
    expect(() => new GitHubUrlUtil().parse('http://github.com/openai/example')).toThrow();
    expect(() =>
      new GitHubUrlUtil().parse('https://github.com.evil.test/openai/example'),
    ).toThrow();
    expect(() =>
      new GitHubUrlUtil().parse('https://github.com/openai/example/tree/main'),
    ).toThrow();
  });
});
