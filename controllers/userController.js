const User = require('../models/User');
const crypto = require('crypto');
const mailHendler = require('../handlers/mailHandler');

exports.login = (req, res) => {
    res.render('login');
};

exports.loginAction = (req, res) => {
    const auth = User.authenticate();

    auth(req.body.email, req.body.password, (error, result) => {
        if(!result) {
            req.flash('error', 'E-mail e/ou senha errados!');
            res.redirect('/users/login');
            return;
        }
        req.login(result, ()=>{});
        req.flash('success', 'Login efetuado com sucesso!');
        res.redirect('/');
    });
};

exports.register = (req, res) => {
    res.render('register');
};

exports.registerAction = (req, res) => {
    const newUser = new User(req.body);
    User.register(newUser, req.body.password, (error) => {
        if(error) {
            req.flash('error', 'Error ao cadastrar, tente mais tarde.');
            res.redirect('/users/regiter');
            return;
        }
        req.flash('success', 'Cadastro realizado com sucesso, faça o login.');
        res.redirect('/users/login');
    });
};
exports.logout = (req, res)=>{
    req.logout();
    res.redirect('/');
};

exports.profile = (req, res) => {
    res.render('profile');
};

exports.profileAction = async (req, res) => {
    try{
        const user = await User.findOneAndUpdate(
            { _id:req.user._id },
            { name:req.body.name, email:req.body.email },
            { new:true, renValidators:true }
        );
    } catch(e) {
        req.flash('error', 'Opsss! Ocorreu algum erro: '+e.message);
        res.redirect('/profile');
        return;
    }
    req.flash('success', 'Dados atualizados com sucesso!');
    res.redirect('/profile');
};

exports.forget = (req, res) => {
    res.render('forget');
};

exports.forgetAction = async (req, res) => {
    // Verificar se o usuário existe
    const user = await User.findOne({email:req.body.email}).exec();
    if(!user) {
        req.flash('error', 'Email não exite nesse sistema.');
        res.redirect('/users/forget');
        return;
    }

    // Gerando token e salvar no banco, com data de expiração
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 360000; // 1 hora

    await user.save();

    // Gerando link com token para tracar a senha
    const resetLink = `http://${req.headers.host}/users/reset/${user.resetPasswordToken}`;

    const to = `${user.name} <${user.email}>`;

    // Enviar o link gerado acima via email
    const html = `Testando email com link gerado:<br/> <a href="${resetLink}">Resete sua senha</a>`;
    const text = `Testando email com link gerado: ${resetLink}`;
    mailHendler.send({
        to,
        subject:'Resete sua senha',
        html,
        text
    });

    req.flash('success', 'Um email foi enviado para você com instruções.');
    res.redirect('/users/login');

};

exports.forgerToken = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    }).exec();

    if(!user) {
        req.flash('error', 'Token expirado');
        res.redirect('/users/forget');
        return;
    }

    res.render('forgetPassword');
};

exports.forgerTokenAction = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    }).exec();

    if(!user) {
        req.flash('error', 'Token expirado');
        res.redirect('/users/forget');
        return;
    }

    // Confirmar que as senhas batem
    if(req.body.password != req.body['password-confirm']) {
        req.flash('error', 'Senhas não conferem!');
        res.redirect('back');
        return;
    }
    // Trocar a senha do usuário
    user.setPassword(req.body.password, async () => {
        await user.save();
        req.flash('seccess', 'Senha auterada com sucesso!');
        res.redirect('/');
    });
};