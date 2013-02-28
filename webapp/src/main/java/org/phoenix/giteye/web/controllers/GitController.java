package org.phoenix.giteye.web.controllers;

import org.phoenix.giteye.core.beans.RepositoryBean;
import org.phoenix.giteye.core.beans.RepositoryConfig;
import org.phoenix.giteye.core.git.services.GitService;
import org.phoenix.giteye.core.git.services.RepositoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpSession;

/**
 * Git Commands controller.
 * @author phoenix
 */
@Controller
@RequestMapping(value = "/git")
public class GitController {
    private final static Logger logger = LoggerFactory.getLogger(GitController.class);
    @Autowired
    private RepositoryService repositoryService;

    @Autowired
    private GitService gitService;

    @RequestMapping(value = "/log.do")
    public String showLog(HttpSession session, Model model) {
        RepositoryConfig selectedRepository = (RepositoryConfig)session.getAttribute("repository");
        if (selectedRepository == null) {
            return "redirect:/repositories/list.do";
        }
        RepositoryBean bean = repositoryService.getRepositoryInformation(selectedRepository.getLocation());
        model.addAttribute("log", gitService.getLog(bean));
        model.addAttribute("gitRepository", bean);
        return "git/log";
    }

    @RequestMapping(value = "/branches.do")
    public String showBranches(HttpSession session, Model model) {
        RepositoryConfig selectedRepository = (RepositoryConfig)session.getAttribute("repository");
        if (selectedRepository == null) {
            return "redirect:/repositories/list.do";
        }
        RepositoryBean bean = repositoryService.getRepositoryInformation(selectedRepository.getLocation());
        model.addAttribute("branches", gitService.getBranches(bean));
        model.addAttribute("gitRepository", bean);
        return "git/branches";
    }

}