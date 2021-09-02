(function() {
  let content = Application("Keyboard Maestro Engine").getvariable("Hook__Content");

  if (content !== '') {
    let fileName = content.split(/[\r\n]/, 1)[0].substr(2)
      .replace('\\[', '[')
      .replace('\\]', ']')
      .replace(/[\[\]:|?/\\\r\n'"]+/g, ' ')
      .trim();

    let url = `obsidian://new?vault=Brain&file=scratch%2F${encodeURIComponent(fileName)}&content=${encodeURIComponent(content)}`;

    let app = Application.currentApplication();
    app.includeStandardAdditions = true;
    app.openLocation(url);
  }
})();
