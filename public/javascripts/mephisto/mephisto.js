/*
  Class, version 2.2
  Copyright (c) 2006, Alex Arnell <alex@twologic.com>
  Licensed under the new BSD License. See end of file for full license terms.
*/
var Class = {
  extend: function(parent, def) {
    if (arguments.length == 1) def = parent, parent = null;
    var func = function() {
      if (!Class.extending) this.initialize.apply(this, arguments);
    };
    if (typeof(parent) == 'function') {
      Class.extending = true;
      func.prototype = new parent();
      delete Class.extending;
    }
    var mixins = [];
    if (def && def.include) {
      if (def.include.reverse) {
        // methods defined in later mixins should override prior
        mixins = mixins.concat(def.include.reverse());
      } else {
        mixins.push(def.include);
      }
      delete def.include; // clean syntax sugar
    }
    if (def) Class.inherit(func.prototype, def);
    for (var i = 0; (mixin = mixins[i]); i++) {
      Class.mixin(func.prototype, mixin);
    }
    return func;
  },
  mixin: function (dest) {
    for (var i = 1; (src = arguments[i]); i++) {
      if (typeof(src) != 'undefined' && src !== null) {
        for (var prop in src) {
          if (!dest[prop] && typeof(src[prop]) == 'function') {
            // only mixin functions, if they don't previously exist
            dest[prop] = src[prop];
          }
        }
      }
    }
    return dest;
  },
  inherit: function(dest, src, fname) {
    if (arguments.length == 3) {
      var ancestor = dest[fname], descendent = src[fname], method = descendent;
      descendent = function() {
        var ref = this.parent; this.parent = ancestor;
        var result = method.apply(this, arguments);
        ref ? this.parent = ref : delete this.parent;
        return result;
      };
      // mask the underlying method
      descendent.valueOf = function() { return method; };
      descendent.toString = function() { return method.toString(); };
      dest[fname] = descendent;
    } else {
      for (var prop in src) {
        if (dest[prop] && typeof(src[prop]) == 'function') {
          Class.inherit(dest, src, prop);
        } else {
          dest[prop] = src[prop];
        }
      }
    }
    return dest;
  },
  // finally remap Class.create for backward compatability
  create: function() {
    return Class.extend.apply(this, arguments);
  }
};
/*
  Redistribution and use in source and binary forms, with or without modification, are
  permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this list
    of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice, this
    list of conditions and the following disclaimer in the documentation and/or other
    materials provided with the distribution.
  * Neither the name of typicalnoise.com nor the names of its contributors may be
    used to endorse or promote products derived from this software without specific prior
    written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
  THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
  OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
  HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
  TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


// TODO:  Fix buggles
var DropMenu = Class.create();
DropMenu.prototype = {
  initialize: function(element) {
    this.menu = $(element);
    if(!this.menu) return;
    this.trigger = document.getElementsByClassName('trigger', this.menu)[0];
    this.options = $('optgroup');
    this.focused = false;
    
    Event.observe(this.trigger, 'click', this.onTriggerClick.bindAsEventListener(this));
    Event.observe(this.menu, 'mouseover', this.onMenuFocus.bindAsEventListener(this));
    Event.observe(this.menu, 'mouseout', this.onMenuBlur.bindAsEventListener(this));
  },
  
  onTriggerClick: function(event) {
    Event.stop(event);
    Event.element(event).onclick = function() { return false; } //For Safari
    clearTimeout(this.timeout);
    this.options.setStyle({opacity: 1});
    Element.toggle(this.options);
    
    if(this.options.visible())
      Element.addClassName(this.trigger, 'down');
    else
     Element.removeClassName(this.trigger, 'down');
  },
  
  onMenuFocus: function() {
    this.focused = true;
  },
  
  onMenuBlur: function() {
    this.focused = false;
    this.timeout = setTimeout(this.fadeMenu.bind(this), 400);
  },
  
  fadeMenu: function() {
    if(!this.focused) {
      Element.removeClassName(this.trigger, 'down');
      new Effect.Fade(this.options, {duration: 0.2});
    }
  }
}

Object.extend(Array.prototype, {
  toQueryString: function(name) {
    return this.collect(function(item) { return name + "[]=" + encodeURIComponent(item) }).join('&');
  }
});

var TinyTab = Class.create();
TinyTab.callbacks ={
  'latest-files': function() {
    if($('latest-assets').childNodes.length == 0)
      new Ajax.Request('/admin/assets;latest');
  },
  'search-files': function(q) {
    if(!q) return;
    $('spinner').show();
    new Ajax.Request('/admin/assets;search', {parameters: 'q=' + escape(q)});
  }
};

TinyTab.prototype = {
  initialize: function(element, panels) {
    this.container = $(element);
    this.tabPanelContainer = $(panels);
    if(!this.container) return;
    
    this.cachedElement;
    this.setup();
  },
  
  setup: function() {
    var links = document.getElementsByClassName('stabs', this.container)[0]
    links.cleanWhitespace();
    this.tabLinks = $A(links.childNodes);
    this.tabPanels = document.getElementsByClassName('tabpanel', this.container);
    
    this.tabLinks.each(function(link) {
      Event.observe(link, 'click', function(event) {
        var element = Event.element(event);
        var finding = element.getAttribute('href').split('#')[1];
        
        if(TinyTab.callbacks[finding]) TinyTab.callbacks[finding]();
        
        this.tabPanels.each(function(element) { Element.hide(element) });
        
        if(this.cachedElement) {
          this.cachedElement.removeClassName('selected');
        } else {
          this.tabLinks[0].firstChild.removeClassName('selected');
        }
        
        element.addClassName('selected');
        $(finding).show();
        Event.stop(event);
        element.onclick = function() { return false; } //Safari bug
        this.cachedElement = element;
      
      }.bindAsEventListener(this));
    }.bind(this));
  }
}

Asset = {
  upload: function(form) {
    form = $(form);
    '/admin/articles/edit/105'
    article_id   = location.href.match(/\/edit\/([0-9]+)/);
    form.action  = "/admin/articles/upload"
    if(article_id) form.action += "/" + article_id[1]
    form.submit();
  }
}


/*-------------------- Flash ------------------------------*/
// Flash is used to manage error messages and notices from 
// Ajax calls.
//
var Flash = {
  // When given an flash message, wrap it in a list 
  // and show it on the screen.  This message will auto-hide 
  // after a specified amount of milliseconds
  show: function(flashType, message) {
    new Effect.ScrollTo('flash-' + flashType);
    $('flash-' + flashType).innerHTML = '';
    if(message.toString().match(/<li/)) message = "<ul>" + message + '</ul>'
    $('flash-' + flashType).innerHTML = message;
    new Effect.Appear('flash-' + flashType, {duration: 0.3});
    setTimeout(Flash['fade' + flashType[0].toUpperCase() + flashType.slice(1, flashType.length)].bind(this), 5000)
  },
  
  errors: function(message) {
    this.show('errors', message);
  },

  // Notice-level messages.  See Messenger.error for full details.
  notice: function(message) {
    this.show('notice', message);
  },
  
  // Responsible for fading notices level messages in the dom    
  fadeNotice: function() {
    new Effect.Fade('flash-notice', {duration: 0.3});
  },
  
  // Responsible for fading error messages in the DOM
  fadeError: function() {
    new Effect.Fade('flash-errors', {duration: 0.3});
  }
}

var ArticleForm = {
  saveDraft: function() {
    var isDraft = $F(this);
    if(isDraft) Element.hide('publish-date-lbl', 'publish-date');
    else Element.show('publish-date-lbl', 'publish-date');
  },

  getAvailableComments: function() {
    return $$('ul.commentlist li').reject(function(div) { return !(div.visible() && !div.hasClassName('disabled') && div.id.match(/^comment-/)); }).collect(function(div) { return div.id.match(/comment-(\d+)/)[1] });
  },
  
  getRevision: function() {
    var rev = $F(this)
    var url = '/admin/articles/edit/' + location.href.match(/\/edit\/([0-9]+)/)[1];
    if(rev != '0') url += "/" + rev;
    location.href = url;
  }
}

Comments = {
  filter: function() {
    location.href = "?filter=" + $F(this).toLowerCase();
  }
}

var UserForm = {
  toggle: function(chk) {
    $('user-' + chk.getAttribute('value') + '-progress').show();
    new Ajax.Request('/admin/users/' + (chk.checked ? 'enable' : 'destroy') + '/' + chk.getAttribute('value'));
  }
}

var SectionForm = {
  toggleSettings: function() {
    Element.toggle('blog-options');
  },

  sortable: null,
  toggleSortable: function(link, section_id) {
    if($('pages').className == 'sortable') {
      Sortable.destroy('pages');
      $('pages').className = '';
      link.innerHTML = 'Reorder pages'
      link.className = 'reorder';
      document.getElementsByClassName('handle', 'pages').each(function(img) {
        img.src = "/images/icons/arrow3_e.gif";
      });
      this.saveSortable(section_id);
    } else {
      this.sortable = Sortable.create('pages', {handle:'handle'});
      $('pages').className = 'sortable';
      document.getElementsByClassName('handle', 'pages').each(function(img) {
        img.src = "/images/icons/reorder.gif";
      });
      link.className = 'reordering';
      link.innerHTML = 'Done Reordering'
    }
  },

  saveSortable: function(section_id) {
    var query = $$('#pages li').inject([], function(qu, li) {
      qu.push('article_ids[]=' + li.getAttribute('id').substr(5));
      return qu;
    }).join('&')
    new Ajax.Request('/admin/sections/order/' + section_id, {asynchronous:true, evalScripts:true, parameters:query});
  }
}

var Spotlight = Class.create();
Spotlight.prototype = {
  initialize: function(form, searchbox) {
    var options, types, attributes = [];
    this.form = $(form);
    var search = $(searchbox);
    Event.observe(searchbox, 'click', function(e) { Event.element(e).value = '' });
    search.setAttribute('autocomplete', 'off');
    
    new Form.Element.Observer(searchbox, 1,  this.search.bind(this));
    
    types = $A($('type').getElementsByTagName('LI'));
    attributes = $A($('attributes').getElementsByTagName('LI'));
    attributes = attributes.reject(function(e) { return e.id.length < 1 });
    attributes.push(types);
    attributes = attributes.flatten();
    attributes.each(function(attr) {
      Event.observe(attr, 'click', this.onClick.bindAsEventListener(this));
    }.bind(this));
  },
  
  onClick: function(event) {
    var element = Event.element(event), check;
    if(element.tagName != 'LI') element = Event.findElement(event, 'LI');
    var check = ($(element.id + '-check'));
    
    if(Element.hasClassName(element, 'pressed')) {
      Element.removeClassName(element, 'pressed');
      check.removeAttribute('checked');
    } else {
      Element.addClassName(element, 'pressed');
      check.setAttribute('checked', 'checked');
    }
    
    this.search();
  },
  
  search: function(page) {
    $('spinner').show();
    $('page').value = page || '1';
    new Ajax.Request(this.form.action, {
      asynchronous: true, 
      evalScripts:  true, 
      parameters:   Form.serialize(this.form),
      method: 'get'
    }); 
    return false;
  }
}


/*
 * Implement a custom Event Observer.  Makes it easeir to do 
 * OSX Spotlight style searching where specific elements are 
 * shown based on the previous selection.
 */
 
Abstract.SmartEventObserver = Class.extend(Abstract.EventObserver, {
  onElementEvent: function(event) {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(Event.element(event), value, event);
      this.lastValue = value;
    }
  }
});

var SmartForm = {};
SmartForm.EventObserver = Class.extend(Abstract.SmartEventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

var SmartSearch = Class.create();
SmartSearch.prototype = {
  initialize: function(form, conditions, triggersSubmit) {
    this.element = $(form);
    this.conditions = $H(conditions);
    this.triggersSubmit = $(triggersSubmit);
    if(!this.element) return;
    
    new SmartForm.EventObserver(this.element, this.onChange.bind(this));
  },
  
  onChange: function(element, event) {
    if(element == this.triggersSubmit) {
      this.element.submit();
      return false;
    }
    
    this.conditions.each(function(condition) {
      var items = condition.key.split(',');
      var toShow = items[0].strip();
      var toHide = items[1].strip();
      if(condition.value.include($F(element))) {
        Element.show(toShow);
        Element.hide(toHide);
      }
    }.bind(this));
    return false;
  }
}


Event.observe(window, 'load', function() {
  new DropMenu('select');
  TinyTab.filetabs = new TinyTab('filetabs', 'tabpanels');
  if($('filesearch')) window.spotlight = new Spotlight('filesearchform', 'filesearch');
  
  // TODO: IE doesn't fire onchange for checkbox
  var commentsView   = $('comments-view');
  var articleDraft   = $('article-draft');
  var revisions      = $('revisionnum');
  
  if(revisions)      Event.observe(revisions, 'change', ArticleForm.getRevision.bind(revisions));
  if(commentsView)   Event.observe(commentsView,   'change', Comments.filter.bind(commentsView));
  if(articleDraft)   Event.observe(articleDraft,   'change', ArticleForm.saveDraft.bind(articleDraft));
  
  ['notice', 'errors'].each(function(flashType) {
    var el = $('flash-' + flashType);
    if(el.innerHTML != '') Flash.show(flashType, el.innerHTML);
  })
  
  new SmartSearch('article-search', {
    'sectionlist, manualsearch': ['section'],
    'manualsearch, sectionlist': ['title', 'body', 'tags']
  }, 'sectionlist');
});
