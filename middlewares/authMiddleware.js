exports.isLogged = (req, res, next) => {
    if(!req.isAuthenticated()) {
       req.flash('error', 'Ops! Você precisa está logado para acessar esta página');
       res.redirect('/users/login');
       return; 
    }

    next();
};

exports.changePassword = (req, res) => {
    // Confirmar que as senhas batem
    if(req.body.password != req.body['password-confirm']) {
        req.flash('error', 'Senhas não conferem!');
        res.redirect('/profile');
        return;
    }
    // Trocar a senha do usuário
    req.user.setPassword(req.body.password, async () => {
        await req.user.save();
        req.flash('seccess', 'Senha auterada com sucesso!');
        res.redirect('/');
    });
};